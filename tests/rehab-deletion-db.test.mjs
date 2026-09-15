import test from "node:test";
import assert from "node:assert/strict";
import { createRehabTestDb, seedRehabTestDb, asUser, ids } from "./helpers/rehab-db.mjs";

test("record deletion is scoped and cascades through entries, plans, cycles, appointments and player access", async () => {
  const db = await createRehabTestDb();
  try {
    await seedRehabTestDb(db);
    await asUser(db, ids.admin);
    await db.query("insert into rehab_daily_entries(workspace_id,patient_id,recorded_on,condition_summary,therapy,created_by) values($1,$2,'2026-09-15','QA','Movement',$3)", [ids.club, ids.athlete, ids.admin]);
    await db.query("insert into rehab_appointments(workspace_id,patient_id,starts_at,created_by) values($1,$2,'2026-09-15T07:00Z',$3)", [ids.club, ids.athlete, ids.admin]);
    const plan = (await db.query("select save_rehab_cycle_plan($1,$2,null,'Delete QA','2026-09-01',null,null,null,$3) id", [ids.club, ids.athlete, JSON.stringify([{ title: "First", instructions: "Movement", status: "planned" }])])).rows[0].id;
    for (const user of [ids.viewer, ids.player, ids.therapist]) {
      await asUser(db, user);
      assert.equal((await db.query("delete from rehab_patients where id=$1 returning id", [ids.athlete])).rows.length, 0);
      assert.equal((await db.query("delete from rehab_appointments where patient_id=$1 returning id", [ids.athlete])).rows.length, 0);
    }
    await asUser(db, ids.admin);
    assert.equal((await db.query("delete from rehab_patients where id=$1 and workspace_id=$2 returning id", [ids.athlete, ids.clinic])).rows.length, 0);
    assert.equal((await db.query("delete from rehab_patients where id=$1 and workspace_id=$2 returning id", [ids.athlete, ids.club])).rows.length, 1);
    for (const table of ["rehab_daily_entries", "rehab_plans", "rehab_appointments", "rehab_workspace_members"]) {
      assert.deepEqual((await db.query(`select patient_id from ${table} where patient_id=$1`, [ids.athlete])).rows, []);
    }
    assert.deepEqual((await db.query("select id from rehab_plan_cycles where plan_id=$1", [plan])).rows, []);
    assert.equal((await db.query("select id from rehab_patients where id=$1", [ids.patient])).rows.length, 1);
    assert.equal((await db.query("select id from profiles where id=$1", [ids.player])).rows.length, 1);
  } finally {
    await db.close();
  }
});
