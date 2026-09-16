import test from "node:test";
import assert from "node:assert/strict";
import { createRehabTestDb, seedRehabTestDb, asUser, ids } from "./helpers/rehab-db.mjs";
import { buildAppointmentEmail } from "../src/lib/rehab/appointment-email.ts";
import { deliverAppointmentEmails } from "../src/lib/rehab/appointment-email-worker.ts";
import { sendEmail } from "../src/lib/email.ts";

async function fixture(run) {
  const db = await createRehabTestDb();
  try { await seedRehabTestDb(db); await run(db); } finally { await db.close(); }
}
async function book(db, { patient = ids.patient, workspace = ids.clinic, hours = 48, legacy = false } = {}) {
  const result = await db.query(`insert into rehab_appointments(workspace_id,patient_id,starts_at,created_by,created_at)
    values($1,$2,now()+$3*interval '1 hour',$4,now()-interval '3 days') returning id`, [workspace, patient, hours, ids.admin]);
  const id = result.rows[0].id;
  if (legacy) await db.query("delete from rehab_appointment_emails where appointment_id=$1", [id]);
  return id;
}
const jobs = async db => (await db.query("select * from rehab_appointment_emails order by created_at,version")).rows;
const claim = async (db, id = null, workspace = null) => (await db.query("select * from rehab_claim_appointment_emails($1,$2,20)", [id, workspace])).rows;

test("all appointment events queue atomically to the record email; notes and no-op updates stay quiet", () => fixture(async db => {
  await db.query("update rehab_patients set email='patient@example.test' where id=$1", [ids.patient]);
  await asUser(db, ids.therapist);
  const id = await book(db);
  let rows = await jobs(db);
  assert.equal(rows[0].event, "created");
  assert.equal(rows[0].recipient, "patient@example.test");
  assert.equal(rows[0].payload.locale, "sr");
  await db.query("update rehab_appointments set notes='PRIVATE', reminder_email='someone-else@example.test', status='scheduled' where id=$1", [id]);
  assert.equal((await jobs(db)).length, 1);
  await db.query("update rehab_appointments set starts_at=starts_at+interval '1 day',duration_minutes=45,therapy='PRIVATE therapy' where id=$1", [id]);
  rows = await jobs(db);
  assert.equal(rows[0].status, "skipped");
  assert.equal(rows[1].event, "updated");
  assert.notEqual(rows[1].payload.startsAt, rows[1].payload.previousStartsAt);
  assert.equal(JSON.stringify(rows).includes("PRIVATE"), false);
  for (const status of ["cancelled", "scheduled", "completed"]) {
    await db.query("update rehab_appointments set status=$1 where id=$2", [status, id]);
    assert.equal((await jobs(db)).at(-1).event, status);
  }
  await db.query("delete from rehab_appointments where id=$1", [id]);
  assert.equal((await jobs(db)).at(-1).event, "deleted");
  await db.exec("reset role");
  assert.equal((await claim(db, id)).length, 1);
}));

test("missing email skips every notification even with a legacy override; club mail uses English", () => fixture(async db => {
  const id = await book(db);
  await db.query("update rehab_appointments set reminder_email='override@example.test',starts_at=now()+interval '2 hours' where id=$1", [id]);
  await db.query("select rehab_enqueue_due_appointment_reminders()");
  await db.query("update rehab_appointments set status='cancelled' where id=$1", [id]);
  await db.query("delete from rehab_appointments where id=$1", [id]);
  assert.deepEqual(await jobs(db), []);
  await db.query("update rehab_patients set email='player@example.test' where id=$1", [ids.athlete]);
  await book(db, { patient: ids.athlete, workspace: ids.club });
  assert.equal((await jobs(db))[0].payload.locale, "en");
  await db.query("delete from rehab_patients where id=$1", [ids.athlete]);
  assert.deepEqual(await jobs(db), []);
}));

test("reminders preserve legacy sends, deduplicate, skip last-minute bookings, and cancel on schedule changes", () => fixture(async db => {
  await db.query("update rehab_patients set email='patient@example.test' where id=$1", [ids.patient]);
  const id = await book(db, { hours: 23, legacy: true });
  await book(db, { hours: 2 });
  await db.query("select rehab_enqueue_due_appointment_reminders()");
  await db.query("select rehab_enqueue_due_appointment_reminders()");
  assert.equal((await jobs(db)).filter(x => x.event === "reminder").length, 1);
  await db.query("update rehab_appointments set starts_at=now()+interval '72 hours' where id=$1", [id]);
  assert.equal((await jobs(db)).find(x => x.event === "reminder").status, "skipped");
  await db.query("select rehab_enqueue_due_appointment_reminders()");
  assert.equal((await jobs(db)).filter(x => x.event === "reminder").length, 1);
  // Existing timestamps are retained even if only internal notes change.
  await db.query("insert into rehab_appointments(workspace_id,patient_id,starts_at,created_by,reminder_sent_at) values($1,$2,now()+interval '3 hours',$3,now())", [ids.clinic, ids.patient, ids.admin]);
  await db.query("update rehab_appointments set notes='internal only'");
  await db.query("select rehab_enqueue_due_appointment_reminders()");
  assert.equal((await jobs(db)).filter(x => x.event === "reminder").length, 1);
}));

test("claims isolate workspaces, recover crashes with the same job ID and stop after the idempotency window", () => fixture(async db => {
  await db.query("update rehab_patients set email='patient@example.test' where id=$1", [ids.patient]);
  const id = await book(db);
  assert.equal((await claim(db, id, ids.club)).length, 0);
  const first = (await claim(db, id, ids.clinic))[0];
  assert.equal(first.attempts, 1);
  assert.equal((await claim(db, id)).length, 0);
  await db.query("update rehab_appointment_emails set locked_at=now()-interval '3 minutes' where id=$1", [first.id]);
  const retry = (await claim(db, id))[0];
  assert.equal(retry.id, first.id);
  assert.notEqual(retry.claim_token, first.claim_token);
  assert.equal(retry.attempts, 2);
  await db.query("update rehab_appointment_emails set first_attempt_at=now()-interval '24 hours',locked_at=now()-interval '3 minutes'");
  assert.equal((await claim(db, id)).length, 0);
  assert.equal((await jobs(db))[0].status, "failed");
}));

test("deleting a cancelled appointment preserves an unsent cancellation but does not duplicate a sent one", () => fixture(async db => {
  await db.query("update rehab_patients set email='patient@example.test' where id=$1", [ids.patient]);
  const id = await book(db);
  await db.query("update rehab_appointments set status='cancelled' where id=$1", [id]);
  await db.query("delete from rehab_appointments where id=$1", [id]);
  assert.equal((await claim(db, id))[0].event, "deleted");
  const sentId = await book(db);
  await db.query("update rehab_appointments set status='cancelled' where id=$1", [sentId]);
  await db.query("update rehab_appointment_emails set status='sent' where appointment_id=$1 and event='cancelled'", [sentId]);
  await db.query("delete from rehab_appointments where id=$1", [sentId]);
  assert.deepEqual(await claim(db, sentId), []);
}));

test("removed/changed recipients and cancelled or past appointments cannot receive stale messages", () => fixture(async db => {
  await db.query("update rehab_patients set email='patient@example.test' where id=$1", [ids.patient]);
  const id = await book(db);
  await db.query("update rehab_patients set email=null where id=$1", [ids.patient]);
  assert.deepEqual(await claim(db), []);
  assert.equal((await jobs(db))[0].status, "skipped");
  await db.query("update rehab_patients set email='corrected@example.test' where id=$1", [ids.patient]);
  await db.query("update rehab_appointments set status='cancelled' where id=$1", [id]);
  const cancellation = (await claim(db))[0];
  assert.equal(cancellation.event, "cancelled");
  assert.equal(cancellation.recipient, "corrected@example.test");
  await book(db, { hours: -1 });
  assert.deepEqual(await claim(db), []);
}));

test("notification records and worker RPCs cannot be accessed or changed by unrelated users", () => fixture(async db => {
  await db.query("update rehab_patients set email='patient@example.test' where id=$1", [ids.patient]);
  const id = await book(db);
  for (const user of [ids.viewer, ids.player, ids.viewerB]) {
    await asUser(db, user);
    assert.deepEqual(await jobs(db), []);
    await assert.rejects(claim(db), /permission denied/);
    await assert.rejects(db.query("select rehab_enqueue_due_appointment_reminders()"), /permission denied/);
    await assert.rejects(db.query("update rehab_appointment_emails set recipient='attacker@example.test'"), /permission denied/);
    assert.equal((await db.query("update rehab_appointments set status='cancelled' where id=$1 returning id", [id])).rows.length, 0);
  }
  await asUser(db, ids.therapist);
  assert.equal((await jobs(db)).length, 1);
  await db.exec("reset role; begin");
  await db.query("update rehab_appointments set status='cancelled' where id=$1", [id]);
  await db.exec("rollback");
  assert.equal((await jobs(db)).length, 1);
}));

test("email templates escape HTML, show previous time and never expose clinical/internal data", () => {
  for (const locale of ["sr", "en"]) {
    for (const event of ["created", "updated", "scheduled", "completed", "cancelled", "deleted", "reminder"]) {
      const mail = buildAppointmentEmail(event, { patientName: '<img src=x> & "Name"', workspaceName: "<Club>", locale,
        startsAt: "2026-07-15T08:30:00Z", previousStartsAt: "2026-07-14T08:30:00Z", durationMinutes: 45, appointmentStatus: "scheduled",
        notes: "SECRET", therapy: "SECRET" });
      assert.ok(mail.text.includes("10:30"));
      assert.ok(mail.text.includes("45 min"));
      assert.ok(mail.html.includes("&lt;img src=x&gt;"));
      assert.ok(!mail.html.includes("<Club>"));
      assert.ok(!mail.text.includes("SECRET"));
      if (event === "deleted") assert.ok(!mail.text.includes("Status:"));
    }
  }
});

function workerClient(job, active = true) {
  const updates = [];
  return {
    updates,
    rpc: async () => ({ data: job ? [job] : [], error: null }),
    from: () => ({
      select() { return this; }, eq() { return this; },
      maybeSingle: async () => ({ data: active ? { id: job.id } : null, error: null }),
      update(value) { updates.push(value); return this; },
      then(resolve) { resolve({ error: null }); },
    }),
  };
}
const exampleJob = { id: "job-1", recipient: "patient@example.test", event: "created", claim_token: "token", attempts: 1,
  payload: { patientName: "Patient", workspaceName: "Clinic", locale: "sr", startsAt: "2026-10-15T08:30:00Z", durationMinutes: 60, appointmentStatus: "scheduled" } };

test("worker awaits Resend, records success and retries failures with a stable key", async () => {
  const sent = [];
  let client = workerClient(exampleJob);
  const result = await deliverAppointmentEmails(client, {}, async mail => { sent.push(mail); return true; });
  assert.equal(result.sent, 1);
  assert.equal(sent[0].idempotencyKey, "rehab-appointment/job-1");
  assert.equal(client.updates[0].status, "sent");
  client = workerClient(exampleJob);
  await deliverAppointmentEmails(client, {}, async () => false);
  assert.equal(client.updates[0].status, "pending");
  assert.ok(new Date(client.updates[0].available_at).getTime() > Date.now());
  client = workerClient({ ...exampleJob, attempts: 4 });
  await deliverAppointmentEmails(client, {}, async () => { throw new Error("timeout"); });
  assert.equal(client.updates[0].status, "failed");
  await deliverAppointmentEmails(workerClient(exampleJob, false), {}, async () => assert.fail("Superseded job sent"));
  await deliverAppointmentEmails(workerClient(null), {}, async () => assert.fail("Empty queue sent"));
});

test("existing Resend HTTP integration sends idempotency header without changing other payloads", async t => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.headers["Idempotency-Key"], "rehab-appointment/job-1");
    assert.equal(JSON.parse(options.body).to, "patient@example.test");
    assert.ok(options.signal instanceof AbortSignal);
    return new Response('{"id":"test-email"}', { status: 200 });
  });
  const before = { key: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM };
  process.env.RESEND_API_KEY = "test-only";
  process.env.EMAIL_FROM = "Clinic <test@example.test>";
  try {
    assert.equal(await sendEmail({ to: "patient@example.test", subject: "Test", text: "Test", idempotencyKey: "rehab-appointment/job-1" }), true);
  } finally {
    for (const [key, value] of [["RESEND_API_KEY", before.key], ["EMAIL_FROM", before.from]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
