import test from "node:test";
import assert from "node:assert/strict";
import { rehabCalendarMonth, rehabMonthDays, shiftRehabMonth, rehabAppointmentDay, rehabMonthBounds } from "../src/lib/rehab/calendar.ts";

test("calendar validates months, aligns Monday columns and handles leap years", () => {
  assert.equal(rehabCalendarMonth("2026-13", "2026-09-15"), "2026-09");
  assert.equal(rehabCalendarMonth("2024-02", "2026-09-15"), "2024-02");
  assert.deepEqual(rehabMonthDays("2026-09").slice(0, 3), [null, "2026-09-01", "2026-09-02"]);
  assert.equal(rehabMonthDays("2024-02").filter(Boolean).length, 29);
  assert.equal(rehabMonthDays("2026-02").filter(Boolean).length, 28);
  assert.equal(rehabMonthDays("2026-03").length, 42);
  assert.equal(shiftRehabMonth("2026-12", 1), "2027-01");
  assert.equal(shiftRehabMonth("2026-01", -1), "2025-12");
});

test("queries and grouping use Belgrade calendar boundaries including DST changes", () => {
  assert.equal(rehabAppointmentDay("2026-09-30T22:30:00Z"), "2026-10-01");
  assert.equal(rehabAppointmentDay("2026-01-31T23:30:00Z"), "2026-02-01");
  assert.deepEqual(rehabMonthBounds("2026-03"), { start: "2026-02-28T23:00:00.000Z", end: "2026-03-31T22:00:00.000Z" });
  assert.deepEqual(rehabMonthBounds("2026-10"), { start: "2026-09-30T22:00:00.000Z", end: "2026-10-31T23:00:00.000Z" });
  assert.equal(rehabMonthBounds("2100-12").end, "2100-12-31T23:00:00.000Z");
});
