"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRehabWorkspace } from "@/lib/rehab/access";
import { rehabPatientUrl, rehabUrl } from "@/components/rehab/RehabUi";
import type { Locale } from "@/i18n/routing";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function addSimpleRehabAccountAction(form: FormData) {
  await requireAdmin();
  const locale: Locale = value(form, "locale") === "en" ? "en" : "sr";
  const workspaceId = value(form, "workspace_id");
  const patientId = value(form, "patient_id");
  const role = value(form, "role");
  const access = await requireRehabWorkspace(locale, workspaceId, "manage");
  const back = (query: Record<string, string>) => {
    const fields = { workspace: workspaceId, ...query };
    return role === "player" && value(form, "return_to") === "patient" && z.uuid().safeParse(patientId).success
      ? rehabPatientUrl(locale, patientId, fields) : rehabUrl(locale, "/rehab/tim", fields);
  };
  const fail = (message: string): never => redirect(back({ error: message }));
  const parsed = z.object({
    email: z.email().max(254), name: z.string().min(2).max(100),
    password: z.union([z.literal(""), z.string().min(8).refine(p => new TextEncoder().encode(p).length <= 72)]),
  }).safeParse({ email: value(form, "email").toLowerCase(), name: value(form, "full_name"), password: String(form.get("password") ?? "") });
  if (!parsed.success) fail("Unesite ime, ispravan email i početnu lozinku od najmanje 8 znakova za novi nalog.");
  if (access.workspace.kind === "clinic" ? role !== "therapist" : !["viewer", "player"].includes(role)) fail("Izabrani pristup nije dozvoljen.");
  const admin = createAdminClient();
  if (role === "player") {
    const { data, error } = await admin.from("rehab_patients").select("id").eq("id", patientId).eq("workspace_id", workspaceId).eq("record_type", "player").maybeSingle();
    if (error || !data) fail("Igrač nije pronađen u ovom klubu. Osvežite karton.");
  }
  const { email, name, password } = parsed.data!;
  let targetId: string | null = null;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fail("Nije moguće proveriti naloge. Pokušajte ponovo.");
    const target = data.users.find(user => user.email?.toLowerCase() === email);
    if (target) { targetId = target.id; break; }
    if (data.users.length < 1000) break;
  }
  if (targetId) {
    const [{ data: profile, error: profileError }, { data: membership, error: memberError }] = await Promise.all([
      admin.from("profiles").select("role").eq("id", targetId).maybeSingle(),
      admin.from("rehab_workspace_members").select("workspace_id, role, patient_id").eq("user_id", targetId).maybeSingle(),
    ]);
    if (profileError || memberError || !profile) fail("Postojeći nalog nije moguće proveriti.");
    if (profile!.role === "admin") fail("Glavni administrator već ima pristup klinici i svim klubovima.");
    if (membership) {
      if (membership.workspace_id !== workspaceId) fail("Ovaj email već ima pristup drugoj klinici ili klubu. Koristite poseban nalog ili prvo uklonite prethodni pristup.");
      if (membership.role !== role || (role === "player" && membership.patient_id !== patientId)) fail("Ovaj nalog već ima drugačiji pristup. Prvo ga uklonite u spisku pristupa, pa dodelite novi.");
      redirect(back({ saved: "assigned", member: targetId }));
    }
  }
  let created = false;
  if (!targetId) {
    if (!password) fail("Za novi nalog unesite početnu lozinku od najmanje 8 znakova.");
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
    if (error || !data.user) fail("Nalog nije napravljen. Proverite email i pokušajte ponovo.");
    targetId = data.user!.id;
    created = true;
  }
  const { error } = await admin.from("rehab_workspace_members").insert({
    workspace_id: workspaceId, user_id: targetId, role,
    patient_id: role === "player" ? patientId : null, created_by: access.userId,
  });
  if (error) {
    if (created) await admin.auth.admin.deleteUser(targetId!);
    fail("Pristup nije sačuvan. Osvežite stranicu i proverite da li nalog već postoji.");
  }
  revalidatePath(`/${locale}/rehab`, "layout");
  redirect(back({ saved: created ? "created" : "assigned", member: targetId! }));
}

export async function transferRehabPlayerAction(form: FormData) {
  await requireAdmin();
  const locale: Locale = value(form, "locale") === "en" ? "en" : "sr";
  const workspaceId = value(form, "workspace_id");
  const access = await requireRehabWorkspace(locale, workspaceId, "manage");
  const back = (error: string) => rehabUrl(locale, "/rehab/pacijenti", { workspace: workspaceId, error });
  const parsed = z.object({ patient: z.uuid(), source: z.uuid(), confirmed: z.literal("yes") }).safeParse({
    patient: value(form, "patient_id"), source: value(form, "source_workspace_id"), confirmed: value(form, "confirm_transfer"),
  });
  if (access.workspace.kind !== "club" || !parsed.success) redirect(back("Izaberite igrača i potvrdite premeštanje u klub."));
  const { error } = await access.supabase.rpc("rehab_transfer_player", {
    p_patient_id: parsed.data.patient, p_from_workspace_id: parsed.data.source,
    p_to_workspace_id: workspaceId, p_confirm: true,
  });
  if (error) redirect(back(error.code === "PGRST202" ? "Premeštanje čeka novu migraciju baze. Obratite se administratoru." : "Igrač nije premešten. Možda je već promenio klub; osvežite stranicu i pokušajte ponovo."));
  revalidatePath(`/${locale}/rehab`, "layout");
  redirect(rehabPatientUrl(locale, parsed.data.patient, { workspace: workspaceId, saved: "player-transferred" }));
}
