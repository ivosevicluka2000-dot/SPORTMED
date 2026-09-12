import test from "node:test";
import assert from "node:assert/strict";
import { cyclePlanSchema } from "../src/lib/rehab/cycles.ts";
import {
  reportBounds,
  planOverlaps,
  readAllPages,
  reportRequestSchema,
} from "../src/lib/rehab/reports.ts";
const c = {
  title: "Mobilnost",
  goal: "",
  instructions: "Prva vežba\nDruga vežba",
  start_date: null,
  end_date: null,
  status: "planned",
};
const p = {
  title: "Plan",
  goal: "",
  notes: "",
  start_date: "2026-09-10",
  end_date: null,
  cycles: [c, c, c],
};
test("cycles have optional dates and multiline instructions; reject reversed dates, duplicates and empty plans", () => {
  assert.equal(cyclePlanSchema.parse(p).cycles[0].instructions, c.instructions);
  for (const value of [
    { ...p, cycles: [] },
    { ...p, end_date: "2026-09-09" },
    { ...p, cycles: [{ ...c, start_date: "2026-02-30" }] },
    {
      ...p,
      cycles: [{ ...c, start_date: "2026-09-20", end_date: "2026-09-01" }],
    },
    { ...p, cycles: [{ ...c, title: " " }] },
  ])
    assert.equal(cyclePlanSchema.safeParse(value).success, false);
  const id = "40000000-0000-4000-8000-000000000001";
  assert.equal(
    cyclePlanSchema.safeParse({
      ...p,
      cycles: [
        { ...c, id },
        { ...c, id },
      ],
    }).success,
    false,
  );
});
test("report periods include leap day and boundary plans with open ends", () => {
  const base = {
    month: "2024-02",
    year: "2026",
    from: "2026-09-01",
    to: "2026-09-30",
  };
  assert.deepEqual(reportBounds({ ...base, period: "month" }), {
    from: "2024-02-01",
    to: "2024-02-29",
  });
  assert.deepEqual(reportBounds({ ...base, period: "year" }), {
    from: "2026-01-01",
    to: "2026-12-31",
  });
  assert.deepEqual(reportBounds({ ...base, period: "all" }), {
    from: null,
    to: null,
  });
  assert.throws(() =>
    reportBounds({ ...base, period: "range", to: "2026-08-31" }),
  );
  assert.throws(() =>
    reportBounds({ ...base, period: "month", month: "2026-13" }),
  );
  assert.equal(
    planOverlaps(
      { start_date: "2026-01-01", end_date: null },
      base.from,
      base.to,
    ),
    true,
  );
  assert.equal(
    planOverlaps(
      { start_date: "2026-09-30", end_date: "2026-10-02" },
      base.from,
      base.to,
    ),
    true,
  );
  assert.equal(
    planOverlaps(
      { start_date: "2026-10-01", end_date: null },
      base.from,
      base.to,
    ),
    false,
  );
});
test("selected scope must never silently become all when IDs are empty", () => {
  const base = {
    workspaceId: "20000000-0000-4000-8000-000000000001",
    ids: [],
    status: "all",
    period: "all",
    month: "",
    year: "",
    from: "",
    to: "",
    content: "both",
  };
  assert.equal(
    reportRequestSchema.safeParse({ ...base, scope: "selected" }).success,
    false,
  );
  assert.equal(
    reportRequestSchema.safeParse({ ...base, scope: "one" }).success,
    false,
  );
  assert.equal(
    reportRequestSchema.safeParse({ ...base, scope: "all" }).success,
    true,
  );
});
test("all pages includes over 1000 records even when API caps pages; never return partial reports on errors", async () => {
  const items = Array.from({ length: 1255 }, (_, id) => ({ id }));
  const result = await readAllPages(async (from, to) => ({
    data: items.slice(from, Math.min(to + 1, from + 87)),
    error: null,
  }));
  assert.deepEqual(result, items);
  await assert.rejects(
    readAllPages(async (from) =>
      from
        ? { data: null, error: { code: "network" } }
        : { data: items.slice(0, 100), error: null },
    ),
  );
});

// The original migration uses fixed PostgreSQL UUIDs without RFC version bits.
test("reports accept the original clinic and club IDs for one, several and all people", () => {
  for (const workspaceId of [
    "00000000-0000-0000-0000-000000000101",
    "00000000-0000-0000-0000-000000000102",
  ]) {
    const base = { workspaceId, status: "all", period: "all", month: "", year: "", from: "", to: "", content: "both" };
    const person = "30000000-0000-4000-8000-000000000001";
    const other = "30000000-0000-4000-8000-000000000002";
    for (const [scope, ids] of [["one", [person]], ["selected", [person, other]], ["all", []]]) {
      assert.equal(reportRequestSchema.safeParse({ ...base, scope, ids }).success, true, `${workspaceId}: ${scope}`);
    }
    assert.equal(reportRequestSchema.safeParse({ ...base, scope: "selected", ids: [] }).success, false);
    assert.equal(reportRequestSchema.safeParse({ ...base, workspaceId: "not-an-id", scope: "all", ids: [] }).success, false);
  }
});
