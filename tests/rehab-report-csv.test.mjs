import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createTranslator } from "next-intl";
import { rehabReportCsv, rehabReportCsvFilename } from "../src/lib/rehab/report-csv.ts";

const messages = Object.fromEntries(await Promise.all(["sr", "en"].map(async (locale) => [
  locale, JSON.parse(await readFile(new URL(`../messages/${locale}.json`, import.meta.url))),
])));
const report = {
  workspace: { id: "club", kind: "club", name: "Test club" },
  from: "2026-09-01", to: "2026-09-30", content: "individual",
  cards: [
    {
      first_name: "Željko", last_name: "Ivić", problem: 'Shoulder, "left"\nSecond line', status: "active",
      plans: [
        { title: "Rehab", status: "active", cycles: [
          { cycle_number: 2, status: "in_progress", title: "Strength" },
          { cycle_number: 1, status: "in_progress", title: "Mobility" },
          { cycle_number: 3, status: "planned", title: "Future" },
        ] },
        { title: "Old plan", status: "completed" },
      ],
      entries: [
        { recorded_on: "2026-09-20", therapy: "Exercises\nManual therapy" },
        { recorded_on: "2026-09-10", therapy: "Older entry" },
      ],
    },
    { first_name: "Ana", last_name: "Jović", problem: null, status: "completed", plans: [], entries: [] },
  ],
};
const csv = (value, locale) => rehabReportCsv(value, locale, createTranslator({ locale, messages: messages[locale], namespace: "rehab" }));

test("CSV follows the report language, preserves entered text and exports only selected people", () => {
  const before = JSON.stringify(report);
  const en = csv(report, "en");
  const sr = csv(report, "sr");
  assert.ok(en.startsWith('\uFEFF"Player","Problem / injury","Current status"'));
  assert.ok(sr.startsWith('\uFEFF"Igrač","Problem / povreda","Trenutni status"'));
  assert.ok(en.includes('"Active"'));
  assert.ok(sr.includes('"Aktivan"'));
  assert.ok(en.includes('"20/09/2026"'));
  assert.ok(sr.includes('"20.09.2026."'));
  for (const value of [en, sr]) {
    assert.ok(value.includes('"Željko Ivić"'));
    assert.ok(value.includes('"Shoulder, ""left"" Second line"'));
    assert.ok(value.includes('"Exercises Manual therapy"'));
    assert.ok(!value.includes("Older entry"));
    assert.ok(!value.includes("Old plan"));
    assert.ok(!value.includes("Future"));
    assert.equal(value.trimEnd().split("\r\n").length, 3);
  }
  assert.ok(en.includes("Cycle 1: Mobility; Cycle 2: Strength"));
  assert.ok(sr.includes("Ciklus 1: Mobility; Ciklus 2: Strength"));
  assert.ok(en.includes('"Ana Jović","","Completed","","",""'));
  const one = csv({ ...report, cards: report.cards.slice(0, 1) }, "en");
  assert.ok(!one.includes("Ana Jović"));
  assert.equal(JSON.stringify(report), before);
});

test("CSV escapes formula prefixes and quotes in free text and labels clinic reports correctly", () => {
  for (const text of ['=1+1', '+SUM(1,2)', '-1+1', '@SUM(1,2)', '\t =HYPERLINK("x")']) {
    const value = csv({ ...report, workspace: { ...report.workspace, kind: "clinic" }, cards: [
      { ...report.cards[1], problem: text },
    ] }, "en");
    assert.ok(value.startsWith('\uFEFF"Patient"'));
    assert.ok(value.includes(`"'${text.trim().replaceAll('"', '""')}"`));
  }
  assert.equal(rehabReportCsvFilename(report, "en"), "rehabilitation-summary-2026-09-01_2026-09-30-en.csv");
  assert.equal(rehabReportCsvFilename({ ...report, from: null, to: null }, "sr"), "rehabilitacija-pregled-svi-datumi-sr.csv");
});
