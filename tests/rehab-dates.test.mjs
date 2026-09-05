import assert from "node:assert/strict";
import test from "node:test";
import { isValidRehabDate, localBelgradeDateTimeToIso, dateTimeLocalInputValue } from "../src/lib/rehab/dates.ts";

test("accepts real dates, leap days and supported boundaries", () => {
  for (const date of ["1900-01-01", "2024-02-29", "2026-09-05", "2100-12-31"]) {
    assert.equal(isValidRehabDate(date), true, date);
  }
});

test("rejects rolled-over dates, malformed input and unsupported years", () => {
  for (const date of ["", "2026-2-01", "2026-02-29", "1900-02-29", "2100-02-29", "2026-04-31", "2026-13-01", "2026-01-00", "1899-12-31", "2101-01-01", "2026-09-05T12:00"]) {
    assert.equal(isValidRehabDate(date), false, date);
  }
});

test("converts Belgrade appointments in winter and summer", () => {
  assert.equal(localBelgradeDateTimeToIso("2026-01-15T10:30"), "2026-01-15T09:30:00.000Z");
  assert.equal(localBelgradeDateTimeToIso("2026-07-15T10:30"), "2026-07-15T08:30:00.000Z");
  assert.equal(dateTimeLocalInputValue(new Date("2026-07-15T08:30:00Z")), "2026-07-15T10:30");
});

test("rejects invalid appointment dates and times", () => {
  for (const value of ["2026-02-30T10:00", "2026-09-05T24:00", "2026-09-05T12:60", "2026-09-05", "invalid"]) {
    assert.throws(() => localBelgradeDateTimeToIso(value), /Termin nije ispravno unet/);
  }
});
