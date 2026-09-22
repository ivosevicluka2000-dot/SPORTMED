import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { createTranslator } from "next-intl";
import { rehabReportXlsx, rehabReportXlsxFilename } from "../src/lib/rehab/report-xlsx.ts";

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
        { title: "Second active plan", status: "active", cycles: [] },
      ],
      entries: [
        { recorded_on: "2026-09-20", therapy: "Exercises\nManual therapy" },
        { recorded_on: "2026-09-10", therapy: "Older entry" },
      ],
    },
    { first_name: "Ana", last_name: "Jović", problem: null, status: "completed", plans: [], entries: [] },
  ],
};
async function readExport(value = report, locale = "en") {
  const bytes = await rehabReportXlsx(value, locale, createTranslator({ locale, messages: messages[locale], namespace: "rehab" }));
  assert.ok(bytes instanceof Uint8Array);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  assert.equal(workbook.worksheets.length, 1);
  return workbook.worksheets[0];
}

test("XLSX preserves selected report data and original text in both languages", async () => {
  const before = JSON.stringify(report);
  for (const locale of ["en", "sr"]) {
    const sheet = await readExport(report, locale);
    assert.equal(sheet.name, locale === "en" ? "Summary" : "Pregled");
    assert.equal(sheet.getCell("A2").value, `Test club — ${messages[locale].rehab.summaryReport}`);
    assert.match(sheet.getCell("A3").value, locale === "en" ? /01\/09\/2026 – 30\/09\/2026/ : /01\.09\.2026\. – 30\.09\.2026\./);
    assert.deepEqual(sheet.getRow(6).values.slice(1), locale === "en"
      ? ["Player", "Injury / problem", "Status", "Active plan / cycles", "Therapy date", "Last therapy"]
      : ["Igrač", "Povreda / problem", "Status", "Aktivni plan / ciklusi", "Datum terapije", "Poslednja terapija"]);
    assert.equal(sheet.rowCount, 8);
    assert.equal(sheet.getCell("A7").value, "Željko Ivić");
    assert.equal(sheet.getCell("B7").value, report.cards[0].problem);
    assert.equal(sheet.getCell("C7").value, messages[locale].rehab.active);
    const cycle = messages[locale].rehab.cycle;
    assert.equal(sheet.getCell("D7").value, `Rehab\n${cycle} 1: Mobility\n${cycle} 2: Strength\n\nSecond active plan`);
    assert.equal(sheet.getCell("E7").type, ExcelJS.ValueType.Date);
    assert.equal(sheet.getCell("E7").value.toISOString(), "2026-09-20T00:00:00.000Z");
    assert.equal(sheet.getCell("E7").numFmt, locale === "en" ? "dd/mm/yyyy" : "dd.mm.yyyy");
    assert.equal(sheet.getCell("F7").value, "Exercises\nManual therapy");
    assert.equal(sheet.getCell("C8").value, messages[locale].rehab.completed);
    for (const column of ["B", "D", "E", "F"]) assert.ok(!sheet.getCell(`${column}8`).value);
  }
  const one = await readExport({ ...report, cards: report.cards.slice(0, 1) });
  assert.equal(one.rowCount, 7);
  assert.equal(one.getCell("A7").value, "Željko Ivić");
  assert.equal(JSON.stringify(report), before);
});

test("XLSX saves readable layout, status rules, filters and print settings", async () => {
  const sheet = await readExport();
  assert.deepEqual(sheet.columns.map(column => column.width), [24, 40, 15, 34, 18, 48]);
  assert.equal(sheet.getCell("A6").fill.fgColor.argb, "FF4F636A");
  assert.equal(sheet.getCell("A6").font.color.argb, "FFFFFFFF");
  assert.equal(sheet.getCell("A7").font.bold, true);
  assert.equal(sheet.getCell("B7").alignment.wrapText, true);
  assert.equal(sheet.getCell("B7").alignment.vertical, "top");
  assert.equal(sheet.getCell("B7").fill.fgColor.argb, "FFFFFFFF");
  assert.equal(sheet.getCell("B8").fill.fgColor.argb, "FFF1F8FC");
  assert.equal(sheet.getCell("C7").fill.fgColor.argb, "FFDFEFF9");
  assert.equal(sheet.getCell("C8").fill.fgColor.argb, "FFE2F3E9");
  assert.ok(sheet.getRow(7).height >= 92);
  assert.equal(sheet.getRow(8).height, 32);
  assert.equal(sheet.views[0].state, "frozen");
  assert.equal(sheet.views[0].xSplit, 1);
  assert.equal(sheet.views[0].ySplit, 6);
  assert.equal(sheet.views[0].showGridLines, false);
  assert.equal(sheet.autoFilter, "A6:F8");
  assert.equal(sheet.pageSetup.orientation, "landscape");
  assert.equal(sheet.pageSetup.fitToWidth, 1);
  assert.equal(sheet.pageSetup.fitToHeight, 0);
  assert.equal(sheet.pageSetup.printArea, "A1:F8");
  assert.equal(sheet.pageSetup.printTitlesRow, "6:6");
  const [format] = sheet.conditionalFormattings;
  assert.equal(format.ref, "C7:C8");
  assert.deepEqual(format.rules.map(rule => rule.formulae[0]), ['C7="Active"', 'C7="Completed"']);
  assert.equal(format.rules[0].style.fill.fgColor.argb, "FFDFEFF9");
  assert.equal(format.rules[1].style.fill.fgColor.argb, "FFE2F3E9");
});

test("XLSX stores formula-like input as literal text and labels clinic exports", async () => {
  for (const text of ['=1+1', '+SUM(1,2)', '-1+1', '@SUM(1,2)', '\t =HYPERLINK("x")']) {
    const sheet = await readExport({ ...report, workspace: { ...report.workspace, kind: "clinic" }, cards: [
      { ...report.cards[1], problem: text },
    ] });
    assert.equal(sheet.getCell("A6").value, "Patient");
    assert.equal(sheet.getCell("B7").type, ExcelJS.ValueType.String);
    assert.equal(sheet.getCell("B7").value, text);
    assert.equal(sheet.getCell("B7").formula, undefined);
  }
});

test("XLSX expands long rows without shortening text and handles empty reports", async () => {
  const therapy = "Supervised mobility and strength exercises. ".repeat(12);
  const sheet = await readExport({ ...report, cards: [
    { ...report.cards[1], entries: [{ recorded_on: "2026-09-20", therapy }] },
  ] });
  assert.equal(sheet.getCell("F7").value, therapy);
  assert.ok(sheet.getRow(7).height >= 220);
  const empty = await readExport({ ...report, cards: [], from: null, to: null });
  assert.equal(empty.getCell("A3").value, "Period: All dates");
  assert.equal(empty.rowCount, 6);
  assert.equal(empty.autoFilter, "A6:F6");
  assert.equal(empty.conditionalFormattings.length, 0);
  assert.equal(rehabReportXlsxFilename(report, "en"), "rehabilitation-summary-2026-09-01_2026-09-30-en.xlsx");
  assert.equal(rehabReportXlsxFilename({ ...report, from: null, to: null }, "sr"), "rehabilitacija-pregled-svi-datumi-sr.xlsx");
});
