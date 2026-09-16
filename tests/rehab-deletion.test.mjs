import test from "node:test";
import assert from "node:assert/strict";
import { matchesRecordDeletionName } from "../src/lib/rehab/deletion.ts";

test("record deletion accepts the uppercase displayed name and harmless spacing differences", () => {
  assert.equal(matchesRecordDeletionName("QA KARTON", "QA", "Karton"), true);
  assert.equal(matchesRecordDeletionName("  MILOŠ\u00a0  JOVIĆ  ", "Miloš", "Jović"), true);
  assert.equal(matchesRecordDeletionName("Milos\u030c Jovic\u0301", "Miloš", "Jović"), true);
});

test("record deletion still requires the complete correct name", () => {
  for (const input of ["", "Miloš", "Jović Miloš", "Milos Jovic", "Miloš Jović drugi"]) {
    assert.equal(matchesRecordDeletionName(input, "Miloš", "Jović"), false);
  }
  assert.equal(matchesRecordDeletionName("", "", ""), false);
});
