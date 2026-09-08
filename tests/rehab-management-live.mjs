// Explicitly opted-in integration test. Uses only labeled synthetic records,
// authenticates the existing admin without changing their password, and removes
// only records created by this run. Never prints passwords, tokens or card data.
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const base = process.env.REHAB_QA_BASE_URL;
if (process.env.REHAB_QA_ALLOW_WRITES !== "1" || !["http://localhost:3000", "http://localhost:3001", "https://www.sportcaremed.com"].includes(base)) {
  throw new Error("Set REHAB_QA_ALLOW_WRITES=1 and an explicit allowed REHAB_QA_BASE_URL.");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const marker = `QA-${Date.now()}-${randomBytes(3).toString("hex")}`;
const patients = [], clubs = [], users = [], images = [], handles = [];
const emailPrefix = `qa-${randomUUID()}`;
const report = message => console.log(`PASS: ${message}`);
function checked(result, message) { assert.equal(result.error, null, message + (result.error ? ` (${result.error.code})` : "")); return result.data; }
function handle() {
  const jar = new Map();
  const client = createServerClient(url, anon, { cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: cookies => cookies.forEach(c => c.value ? jar.set(c.name, c.value) : jar.delete(c.name)),
  } });
  const h = { jar, client, async request(path, options = {}) {
    const target = new URL(path, base); assert.equal(target.origin, base);
    const response = await fetch(target, { redirect: "manual", ...options, headers: { Cookie: [...jar].map(([k,v]) => `${k}=${v}`).join("; "), Origin: base, ...options.headers } });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";", 1)[0], index = pair.indexOf("=");
      const key = pair.slice(0,index), val = pair.slice(index+1); val ? jar.set(key,val) : jar.delete(key);
    }
    return response;
  } };
  handles.push(h); return h;
}
const decode = value => value.replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
async function formAt(h, path, includes) {
  const response = await h.request(path); assert.equal(response.status, 200, `GET ${new URL(path,base).pathname}`);
  const html = await response.text();
  const form = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map(x => x[0]).find(f => f.includes(includes));
  assert.ok(form, `Expected form ${includes} at ${new URL(path,base).pathname}`);
  const fields = new FormData();
  for (const input of form.matchAll(/<input\b[^>]*>/g)) {
    const attrs = Object.fromEntries([...input[0].matchAll(/([\w:$-]+)="([^"]*)"/g)].map(m => [m[1], decode(m[2])]));
    if (attrs.type === "hidden" && attrs.name) fields.append(attrs.name, attrs.value ?? "");
  }
  assert.ok([...fields.keys()].some(k => k.startsWith("$ACTION_")), "Server action marker present");
  return fields;
}
async function submit(h, path, includes, values, expectedError = false) {
  const fields = await formAt(h, path, includes);
  for (const [key, value] of Object.entries(values)) fields.set(key, value);
  const response = await h.request(path, { method: "POST", body: fields });
  await response.arrayBuffer();
  assert.equal(response.status, 303, `POST ${new URL(path,base).pathname}`);
  const location = new URL(response.headers.get("location"), base);
  assert.equal(location.searchParams.has("error"), expectedError, `Action ${includes} returned unexpected result`);
  return location;
}
async function account(owner, workspace, role, suffix, patientId) {
  const email = `${emailPrefix}-${suffix}@example.invalid`, password = randomBytes(24).toString("base64url");
  // Track by exact email before submission so cleanup also handles a partial failure.
  users.push({ email, id: null });
  const path = patientId ? `/sr/rehab/pacijenti/${patientId}?workspace=${workspace}` : `/sr/rehab/tim?workspace=${workspace}`;
  await submit(owner, path, 'name="full_name"', { full_name: `${marker} ${suffix}`, email, password });
  const listed = checked(await service.auth.admin.listUsers({ perPage: 1000 }), "List QA account");
  const user = listed.users.find(u => u.email === email); assert.ok(user, "Account was created");
  users.find(u => u.email === email).id = user.id;
  const member = checked(await service.from("rehab_workspace_members").select("workspace_id,role,patient_id").eq("user_id",user.id).single(), "Read QA membership");
  assert.equal(member.workspace_id, workspace); assert.equal(member.role,role); assert.equal(member.patient_id,patientId ?? null);
  const h = handle();
  await submit(h, "/sr/rehab/prijava", 'name="password"', { locale:"sr", email, password, next:"/sr/rehab" });
  assert.equal((await h.request("/sr/rehab")).status,200,"Actual Rehab login session works");
  // SDK for narrowly scoped RLS assertions, independently authenticate the same QA account.
  const db = createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  checked(await db.auth.signInWithPassword({email,password}), "QA password login");
  return {h, db, email, password, id:user.id, path};
}
let owner;
try {
  const admins = checked(await service.from("profiles").select("id").eq("role","admin"), "Find existing admin");
  assert.ok(admins.length);
  const adminUser = checked(await service.auth.admin.getUserById(admins[0].id), "Existing admin identity").user;
  owner = handle();
  const link = checked(await service.auth.admin.generateLink({type:"magiclink",email:adminUser.email}), "QA admin sign-in link");
  checked(await owner.client.auth.verifyOtp({type:"email",token_hash:link.properties.hashed_token}), "QA admin session");
  const clinic = checked(await service.from("rehab_workspaces").select("id").eq("kind","clinic").limit(1).single(), "Clinic exists").id;
  const createClub = async suffix => {
    const name = `${marker} ${suffix}`;
    const result = await submit(owner, "/sr/rehab/klubovi", 'name="name"', {name});
    const id = result.searchParams.get("workspace"); assert.ok(id); clubs.push(id);
    assert.equal(result.pathname,"/sr/rehab/pacijenti");
    const count = await service.from("rehab_patients").select("id",{count:"exact",head:true}).eq("workspace_id",id);
    assert.equal(count.count,0); return id;
  };
  const a = await createClub("Club A"), b = await createClub("Club B");
  report("admin creates empty clubs without accounts or players");
  const createCard = async (workspace,suffix) => {
    const result = await submit(owner,`/sr/rehab/pacijenti/novi?workspace=${workspace}`,'name="first_name"',{
      first_name:marker,last_name:suffix,email:"",phone:"",birth_date:"",problem:`${marker} synthetic only`,started_on:"2026-09-08",notes:"QA synthetic record",
    });
    const id = result.pathname.split("/").at(-1); assert.match(id,/^[0-9a-f-]{36}$/); patients.push(id); return id;
  };
  const c1 = await createCard(clinic,"Clinic One"), c2 = await createCard(clinic,"Clinic Two");
  const a1 = await createCard(a,"Player One"), a2 = await createCard(a,"Player Two"), b1 = await createCard(b,"Player Three");
  report("cards are created directly inside the selected clinic or club");
  const physio = await account(owner,clinic,"therapist","physio");
  const repA = await account(owner,a,"viewer","club-a");
  const repB = await account(owner,b,"viewer","club-b");
  const player = await account(owner,a,"player","player",a1);
  report("admin creates therapist, club and individual player accounts; actual Rehab login works for all");
  const visibleIds = async db => checked(await db.from("rehab_patients").select("id").in("id",patients),"Scoped card query").map(p=>p.id).sort();
  assert.deepEqual(await visibleIds(physio.db),[c1,c2].sort());
  assert.deepEqual(await visibleIds(repA.db),[a1,a2].sort());
  assert.deepEqual(await visibleIds(repB.db),[b1]);
  assert.deepEqual(await visibleIds(player.db),[a1]);
  report("RLS isolates clinic, each club and the individual player");
  await submit(physio.h,`/sr/rehab/pacijenti/${c1}?workspace=${clinic}`,'name="condition_summary"',{
    recorded_on:"2026-09-08",condition_summary:"QA clinic entry",therapy:"QA therapy",pain_level:"2",notes:"Synthetic test only",
  });
  const clinicEntries = checked(await service.from("rehab_daily_entries").select("id").eq("patient_id",c1),"Therapist entry");
  assert.equal(clinicEntries.length,1);
  for (const [person, workspace, card] of [[repA,a,a1],[player,a,a1],[physio,a,a1]]) {
    assert.ok((await person.db.from("rehab_daily_entries").insert({workspace_id:workspace,patient_id:card,recorded_on:"2026-09-08",condition_summary:"Forbidden",therapy:"Forbidden",created_by:person.id})).error);
  }
  report("therapist can record clinic therapy; club and player accounts cannot write, nor can therapists write in clubs");
  const added = await createCard(a,"Late Arrival");
  assert.ok((await visibleIds(repA.db)).includes(added));
  report("club account automatically sees newly added players");
  const clubAPath = `/sr/rehab/tim?workspace=${a}`;
  await submit(owner,clubAPath,'name="full_name"',{full_name:marker,email:repA.email,password:"NotAReplacement123!"});
  checked(await repA.db.auth.signInWithPassword({email:repA.email,password:repA.password}),"Existing password retained");
  await submit(owner,`/sr/rehab/tim?workspace=${b}`,'name="full_name"',{full_name:marker,email:repA.email,password:""},true);
  await submit(owner,`/sr/rehab/pacijenti/${a2}?workspace=${a}`,'name="full_name"',{full_name:marker,email:player.email,password:""},true);
  report("existing password is preserved; cross-club and wrong-player reassignment rejected");
  for (const person of [physio,repA,repB,player]) {
    const main = await person.h.request("/sr/admin");
    const text = await main.text(); assert.ok(main.status!==200 || !text.includes("Otvori Rehab platformu"),"No main admin access");
  }
  const ownerFields = await formAt(owner,clubAPath,'name="full_name"');
  ownerFields.set("full_name",`${marker} prohibited`);ownerFields.set("email",`${emailPrefix}-denied@example.invalid`);ownerFields.set("password",randomBytes(20).toString("hex"));
  const forbidden = await physio.h.request(clubAPath,{method:"POST",body:ownerFields});
  assert.ok(forbidden.status>=400,"Therapist cannot call admin account action");await forbidden.arrayBuffer();
  report("non-admin users cannot use the main admin or account creation action");
  // Fixtures for dependent records and private image access during transfer.
  const entryId = randomUUID(), planId = randomUUID(), dayId = randomUUID();
  checked(await service.from("rehab_daily_entries").insert({id:entryId,workspace_id:a,patient_id:a1,recorded_on:"2026-09-08",condition_summary:"QA",therapy:"QA",created_by:adminUser.id}),"Seed QA entry");
  checked(await service.from("rehab_plans").insert({id:planId,workspace_id:a,patient_id:a1,title:"QA plan",start_date:"2026-09-08",end_date:"2026-09-08",created_by:adminUser.id}),"Seed QA plan");
  checked(await service.from("rehab_plan_days").insert({id:dayId,workspace_id:a,plan_id:planId,day_number:1,planned_date:"2026-09-08",instructions:"QA only",created_by:adminUser.id}),"Seed QA plan day");
  checked(await service.from("rehab_appointments").insert({workspace_id:a,patient_id:a1,starts_at:"2026-09-09T10:00:00Z",duration_minutes:30,created_by:adminUser.id}),"Seed QA appointment");
  const path = `${a}/${a1}/${entryId}/qa.png`;images.push(path);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY9sAAAAASUVORK5CYII=","base64");
  checked(await service.storage.from("rehab-entry-images").upload(path,png,{contentType:"image/png"}),"Upload QA image");
  checked(await service.from("rehab_daily_entries").update({image_paths:[path]}).eq("id",entryId),"Attach QA image");
  assert.ok((await repA.db.storage.from("rehab-entry-images").createSignedUrl(path,60)).data?.signedUrl);
  const transferArgs = {p_patient_id:a1,p_from_workspace_id:a,p_to_workspace_id:b,p_confirm:true};
  assert.ok((await repA.db.rpc("rehab_transfer_player",transferArgs)).error);
  assert.ok((await owner.client.rpc("rehab_transfer_player",{...transferArgs,p_confirm:false})).error);
  assert.ok((await owner.client.rpc("rehab_transfer_player",{...transferArgs,p_patient_id:c1,p_from_workspace_id:clinic})).error);
  assert.ok((await owner.client.rpc("rehab_transfer_player",{...transferArgs,p_to_workspace_id:clinic})).error);
  assert.ok((await owner.client.rpc("rehab_transfer_player",{...transferArgs,p_from_workspace_id:b})).error);
  report("transfer rejects non-admins, absent confirmation, clinic records and stale source clubs");
  await submit(owner,`/sr/rehab/pacijenti?workspace=${b}`,'name="source_workspace_id"',{patient_id:a1,source_workspace_id:a,confirm_transfer:"yes"});
  assert.ok(!(await visibleIds(repA.db)).includes(a1));assert.ok((await visibleIds(repB.db)).includes(a1));assert.deepEqual(await visibleIds(player.db),[a1]);
  for (const table of ["rehab_patients","rehab_daily_entries","rehab_plans","rehab_appointments","rehab_workspace_members"]) {
    const rows=checked(await service.from(table).select("workspace_id").eq(table==="rehab_patients"?"id":"patient_id",a1),`Transfer ${table}`);
    assert.ok(rows.length);assert.ok(rows.every(r=>r.workspace_id===b));
  }
  assert.equal(checked(await service.from("rehab_plan_days").select("workspace_id").eq("id",dayId).single(),"Transfer days").workspace_id,b);
  assert.equal(checked(await service.from("rehab_player_transfers").select("id").eq("patient_id",a1),"Audit transfer").length,1);
  assert.ok(!(await repA.db.storage.from("rehab-entry-images").createSignedUrl(path,60)).data?.signedUrl);
  assert.ok((await repB.db.storage.from("rehab-entry-images").createSignedUrl(path,60)).data?.signedUrl);
  assert.ok((await player.db.storage.from("rehab-entry-images").createSignedUrl(path,60)).data?.signedUrl);
  report("atomic transfer preserves entries, plans, days, appointments, player login and photos; old club access revoked");
  assert.equal((await player.h.request(`/sr/rehab/pacijenti/${a1}?workspace=${b}`)).status,200);
  assert.equal((await repB.h.request(`/sr/rehab/pacijenti/${a1}/planovi/${planId}/stampa?workspace=${b}`)).status,200);
  const deniedPage=await repA.h.request(`/sr/rehab/pacijenti/${a1}?workspace=${a}`);
  const deniedHtml=await deniedPage.text();
  // Next can have already streamed the layout with HTTP 200 before notFound().
  assert.ok(deniedPage.status===404 || deniedHtml.includes("NEXT_HTTP_ERROR_FALLBACK;404"),"Old club gets not-found boundary");
  assert.ok(!deniedHtml.includes(`${marker} synthetic only`),"No transferred chart content in response");
  report("live player card and printable plan work after transfer; old-club direct URL blocked");
  await submit(owner,`/sr/rehab/pacijenti/${a1}?workspace=${b}`,'name="image_path"',{entry_id:entryId,image_path:path,patient_id:a1,workspace_id:b});
  assert.deepEqual(checked(await service.from("rehab_daily_entries").select("image_paths").eq("id",entryId).single(),"Image removal").image_paths,[]);
  report("admin can remove a transferred photo through the application");
  await submit(owner,`/sr/rehab/tim?workspace=${b}`,'name="user_id"',{user_id:repB.id,workspace_id:b});
  assert.deepEqual(await visibleIds(repB.db),[]);
  assert.equal(checked(await service.from("rehab_patients").select("id").eq("id",a1),"Card retained").length,1);
  report("removing access does not delete player records");
  console.log(`SUCCESS: ${base} management integration checks completed.`);
} finally {
  // All targets are exact IDs/emails created and recorded by this run.
  if(images.length) checked(await service.storage.from("rehab-entry-images").remove(images),"Cleanup images");
  if(patients.length) checked(await service.from("rehab_patients").delete().in("id",patients),"Cleanup cards");
  for(const user of users) {
    if(!user.id) {
      const list=checked(await service.auth.admin.listUsers({perPage:1000}),"Find partial QA account");user.id=list.users.find(u=>u.email===user.email)?.id;
    }
    if(user.id) { checked(await service.from("rehab_workspace_members").delete().eq("user_id",user.id),"Cleanup membership");checked(await service.auth.admin.deleteUser(user.id),"Cleanup QA account"); }
  }
  if(clubs.length) checked(await service.from("rehab_workspaces").delete().in("id",clubs),"Cleanup clubs");
  for(const h of handles) await h.client.auth.signOut({scope:"local"});
  console.log(`CLEANUP: removed this run's ${patients.length} synthetic cards, ${clubs.length} clubs and ${users.length} QA accounts; no real records changed.`);
}
