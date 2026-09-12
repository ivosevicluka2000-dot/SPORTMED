import test from "node:test";
import assert from "node:assert/strict";
import {
  createRehabTestDb,
  seedRehabTestDb,
  asUser,
  ids,
} from "./helpers/rehab-db.mjs";

test("cycle migration, transactions, RLS, copying, legacy preservation and club transfer", async () => {
  const db = await createRehabTestDb();
  try {
    await seedRehabTestDb(db);
    await asUser(db, ids.admin);
    const cycle = (title, instructions = "Line one\nLine two") => ({
      title,
      goal: "Mobility",
      instructions,
      start_date: null,
      end_date: null,
      status: "planned",
    });
    const save = async (
      patient,
      workspace,
      cycles,
      plan = null,
      title = "QA cycle plan",
    ) =>
      (
        await db.query(
          "select save_rehab_cycle_plan($1,$2,$3,$4,$5,$6,$7,$8,$9) as id",
          [
            workspace,
            patient,
            plan,
            title,
            "2026-09-10",
            null,
            "Recovery",
            "Notes",
            JSON.stringify(cycles),
          ],
        )
      ).rows[0].id;
    const plan = await save(ids.athlete, ids.club, [
      cycle("Phase A"),
      cycle("Phase B"),
      cycle("Phase C"),
    ]);
    let rows = (
      await db.query(
        "select * from rehab_plan_cycles where plan_id=$1 order by cycle_number",
        [plan],
      )
    ).rows;
    assert.equal(rows.length, 3);
    assert.ok(rows.every((r) => !r.start_date && !r.end_date));
    assert.equal(rows[0].instructions, "Line one\nLine two");
    assert.equal(
      (await db.query("select end_date from rehab_plans where id=$1", [plan]))
        .rows[0].end_date,
      null,
    );
    await save(ids.athlete, ids.club, [rows[2], rows[0], rows[1]], plan);
    rows = (
      await db.query(
        "select * from rehab_plan_cycles where plan_id=$1 order by cycle_number",
        [plan],
      )
    ).rows;
    assert.deepEqual(
      rows.map((r) => r.title),
      ["Phase C", "Phase A", "Phase B"],
    );
    await assert.rejects(
      save(
        ids.athlete,
        ids.club,
        [rows[0], cycle("")],
        plan,
        "Should roll back",
      ),
    );
    assert.equal(
      (await db.query("select title from rehab_plans where id=$1", [plan]))
        .rows[0].title,
      "QA cycle plan",
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from rehab_plan_cycles where plan_id=$1",
          [plan],
        )
      ).rows[0].n,
      3,
    );
    const countBefore = (
      await db.query("select count(*)::int n from rehab_plans")
    ).rows[0].n;
    await assert.rejects(
      save(ids.athlete, ids.club, [
        cycle("Valid"),
        {
          ...cycle("Invalid"),
          start_date: "2026-09-20",
          end_date: "2026-09-10",
        },
      ]),
    );
    assert.equal(
      (await db.query("select count(*)::int n from rehab_plans")).rows[0].n,
      countBefore,
    );
    await assert.rejects(save(ids.other, ids.club, rows)); // An existing cycle ID cannot be stolen.
    await assert.rejects(save(ids.athlete, ids.club, [rows[0], rows[0]], plan));
    await save(
      ids.athlete,
      ids.club,
      [
        {
          ...rows[0],
          start_date: "2026-09-12",
          end_date: "2026-09-30",
          status: "in_progress",
        },
      ],
      plan,
    );
    const copied = (
      await db.query("select copy_rehab_cycle_plan($1,$2,$3,$4,$5) as id", [
        ids.club,
        ids.athlete,
        plan,
        ids.other,
        "2026-10-01",
      ])
    ).rows[0].id;
    const copiedCycle = (
      await db.query("select * from rehab_plan_cycles where plan_id=$1", [
        copied,
      ])
    ).rows[0];
    assert.equal(copiedCycle.status, "planned");
    assert.equal(copiedCycle.start_date, null);
    assert.equal(copiedCycle.end_date, null);
    assert.equal(copiedCycle.title, "Phase C");
    const legacy = (
      await db.query(
        "insert into rehab_plans(workspace_id,patient_id,title,start_date,end_date,created_by) values($1,$2,'Original daily','2026-01-01','2026-01-03',$3) returning id",
        [ids.club, ids.athlete, ids.admin],
      )
    ).rows[0].id;
    await db.query(
      "insert into rehab_plan_days(workspace_id,plan_id,day_number,planned_date,instructions,created_by) values($1,$2,1,'2026-01-01','Keep original date and text',$3)",
      [ids.club, legacy, ids.admin],
    );
    assert.equal(
      (
        await db.query(
          "select update_rehab_plan_schedule($1,$2,$3,$4,$5,null,null) ok",
          [
            ids.club,
            ids.athlete,
            plan,
            "Invalid legacy mutation",
            "2026-01-01",
          ],
        )
      ).rows[0].ok,
      false,
    );
    await assert.rejects(save(ids.athlete, ids.club, [cycle("New")], legacy));
    await asUser(db, ids.therapist);
    await save(ids.patient, ids.clinic, [cycle("Clinic cycle")]);
    await assert.rejects(save(ids.athlete, ids.club, [cycle("Forbidden")]));
    await asUser(db, ids.player);
    assert.equal(
      (await db.query("select count(*)::int n from rehab_plan_cycles")).rows[0]
        .n,
      1,
    );
    await assert.rejects(save(ids.athlete, ids.club, [cycle("Forbidden")]));
    await asUser(db, ids.viewer);
    assert.equal(
      (await db.query("select count(*)::int n from rehab_plan_cycles")).rows[0]
        .n,
      2,
    );
    await assert.rejects(save(ids.other, ids.club, [cycle("Forbidden")]));
    await asUser(db, ids.admin);
    await db.query("select rehab_transfer_player($1,$2,$3,true)", [
      ids.athlete,
      ids.club,
      ids.clubB,
    ]);
    assert.equal(
      (
        await db.query(
          "select workspace_id from rehab_plan_cycles where plan_id=$1",
          [plan],
        )
      ).rows[0].workspace_id,
      ids.clubB,
    );
    const oldDay = (
      await db.query("select * from rehab_plan_days where plan_id=$1", [legacy])
    ).rows[0];
    assert.equal(oldDay.instructions, "Keep original date and text");
    assert.equal(oldDay.workspace_id, ids.clubB);
    assert.equal(
      new Date(oldDay.planned_date).toISOString().slice(0, 10),
      "2026-01-01",
    );
    await asUser(db, ids.viewer);
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from rehab_plan_cycles where plan_id=$1",
          [plan],
        )
      ).rows[0].n,
      0,
    );
    await asUser(db, ids.viewerB);
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from rehab_plan_cycles where plan_id=$1",
          [plan],
        )
      ).rows[0].n,
      1,
    );
    await asUser(db, ids.player);
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from rehab_plan_cycles where plan_id=$1",
          [plan],
        )
      ).rows[0].n,
      1,
    );
  } finally {
    await db.close();
  }
});
