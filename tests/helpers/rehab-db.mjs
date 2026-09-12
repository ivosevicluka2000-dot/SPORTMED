// Isolated PostgreSQL fixture: no production credentials or network access.
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { readFile } from "node:fs/promises";
export async function createRehabTestDb() {
  const db = new PGlite({ extensions: { citext } });
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create extension citext;
    create function public.uuid_generate_v4() returns uuid language sql as 'select gen_random_uuid()';
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table public.profiles(id uuid primary key,full_name text,role text);
    create function public.is_admin() returns boolean language sql stable security definer as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
    create function public.tg_set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;
    grant usage on schema public,auth,storage to authenticated;
    grant select on public.profiles to authenticated;
    alter default privileges in schema public grant select,insert,update,delete on tables to authenticated;
  `);
  for (const name of [
    "0004_rehab_basic.sql",
    "0005_rehab_entry_images.sql",
    "0006_rehab_scoped_access.sql",
    "0007_rehab_qa_hardening.sql",
    "0009_rehab_simple_management.sql",
    "0010_rehab_cycles.sql",
  ]) {
    await db.exec(
      await readFile(
        new URL(`../../supabase/migrations/${name}`, import.meta.url),
        "utf8",
      ),
    );
  }
  return db;
}
export const ids = {
  admin: "10000000-0000-4000-8000-000000000001",
  therapist: "10000000-0000-4000-8000-000000000002",
  viewer: "10000000-0000-4000-8000-000000000003",
  player: "10000000-0000-4000-8000-000000000004",
  viewerB: "10000000-0000-4000-8000-000000000005",
  clinic: "00000000-0000-0000-0000-000000000101",
  club: "00000000-0000-0000-0000-000000000102",
  clubB: "20000000-0000-4000-8000-000000000003",
  patient: "30000000-0000-4000-8000-000000000001",
  athlete: "30000000-0000-4000-8000-000000000002",
  other: "30000000-0000-4000-8000-000000000003",
};
export async function seedRehabTestDb(db) {
  for (const [id, name, role] of [
    [ids.admin, "QA Admin", "admin"],
    [ids.therapist, "QA Therapist", "user"],
    [ids.viewer, "QA Viewer", "user"],
    [ids.player, "QA Player", "user"],
    [ids.viewerB, "QA Viewer B", "user"],
  ])
    await db.query("insert into profiles values($1,$2,$3)", [id, name, role]);
  for (const [id, slug, name, kind] of [
    [ids.clinic, "qa-clinic", "QA Clinic", "clinic"],
    [ids.club, "qa-club", "QA Club", "club"],
    [ids.clubB, "qa-club-b", "QA Club B", "club"],
  ])
    await db.query(
      "insert into rehab_workspaces(id,slug,name,kind) values($1,$2,$3,$4) on conflict(id) do update set slug=excluded.slug,name=excluded.name,kind=excluded.kind",
      [id, slug, name, kind],
    );
  for (const [id, w, kind, name] of [
    [ids.patient, ids.clinic, "patient", "Patient"],
    [ids.athlete, ids.club, "player", "Player"],
    [ids.other, ids.club, "player", "Other"],
  ])
    await db.query(
      "insert into rehab_patients(id,workspace_id,record_type,first_name,last_name,created_by) values($1,$2,$3,$4,'QA',$5)",
      [id, w, kind, name, ids.admin],
    );
  for (const [w, u, role, p] of [
    [ids.clinic, ids.therapist, "therapist", null],
    [ids.club, ids.viewer, "viewer", null],
    [ids.club, ids.player, "player", ids.athlete],
    [ids.clubB, ids.viewerB, "viewer", null],
  ])
    await db.query(
      "insert into rehab_workspace_members(workspace_id,user_id,role,patient_id) values($1,$2,$3,$4)",
      [w, u, role, p],
    );
}
export async function asUser(db, id) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
