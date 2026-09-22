import ExcelJS from "exceljs";
import { formatRehabDate } from "./dates.ts";
import type { RehabReport } from "./reports";

type ReportExcelLabel =
  | "player" | "patient" | "status" | "active" | "completed" | "cycle"
  | "period" | "allDates" | "summaryReport" | "excelSheetName"
  | "excelProblem" | "excelActivePlans" | "excelTherapyDate"
  | "excelLastTherapy" | "excelPeriodNote";

const widths = [24, 40, 15, 34, 18, 48];
const headerRow = 6;
const colors = {
  header: "FF4F636A",
  text: "FF26373D",
  muted: "FF5F757D",
  stripe: "FFF1F8FC",
  border: "FFE1E8EC",
  white: "FFFFFFFF",
  activeFill: "FFDFEFF9",
  activeText: "FF245875",
  completedFill: "FFE2F3E9",
  completedText: "FF246344",
};

// ExcelJS does not auto-fit wrapped rows. Estimate word wrapping conservatively,
// including explicit newlines and unbroken words, with room for font differences.
function wrappedLines(text: string, width: number): number {
  const capacity = Math.max(1, Math.floor((width - 2) / 1.15));
  return text.split(/\r\n|\r|\n/).reduce((total, paragraph) => {
    let lines = 1;
    let used = 0;
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (used && used + 1 + word.length > capacity) {
        lines++;
        used = 0;
      }
      if (used) used++;
      const length = used + word.length;
      lines += Math.floor((length - 1) / capacity);
      used = ((length - 1) % capacity) + 1;
    }
    return total + lines;
  }, 0);
}

export async function rehabReportXlsx(
  report: RehabReport,
  locale: string,
  t: (key: ReportExcelLabel) => string,
): Promise<Uint8Array<ArrayBuffer>> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(t("excelSheetName"), {
    properties: { defaultRowHeight: 28, tabColor: { argb: colors.header } },
    views: [{
      state: "frozen", xSplit: 1, ySplit: headerRow,
      topLeftCell: "B7", activeCell: "A1", showGridLines: false, zoomScale: 85,
    }],
    pageSetup: {
      orientation: "landscape", paperSize: 9,
      fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      printTitlesRow: `${headerRow}:${headerRow}`,
      margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    },
  });
  sheet.columns = widths.map((width) => ({ width }));
  sheet.getRow(1).height = 10;

  const period = report.from && report.to
    ? `${formatRehabDate(report.from, false, locale)} – ${formatRehabDate(report.to, false, locale)}`
    : t("allDates");
  for (const [index, text] of [
    `${report.workspace.name} — ${t("summaryReport")}`,
    `${t("period")}: ${period}`,
    t("excelPeriodNote"),
  ].entries()) {
    const row = index + 2;
    sheet.mergeCells(`A${row}:F${row}`);
    const cell = sheet.getCell(row, 1);
    cell.value = text;
    cell.font = {
      name: "Arial", size: index === 0 ? 16 : 11,
      bold: index === 0, color: { argb: index === 0 ? colors.header : colors.muted },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
    sheet.getRow(row).height = index === 0
      ? Math.max(30, wrappedLines(text, 110) * 22 + 8)
      : 24;
  }
  sheet.getRow(5).height = 10;

  const headers = sheet.getRow(headerRow);
  headers.values = [
    t(report.workspace.kind === "club" ? "player" : "patient"),
    t("excelProblem"), t("status"), t("excelActivePlans"),
    t("excelTherapyDate"), t("excelLastTherapy"),
  ];
  headers.height = 34;
  headers.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: colors.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.header } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { right: { style: "thin", color: { argb: colors.white } } };
  });

  report.cards.forEach((card, index) => {
    // The authenticated loader applies the selection/period and orders entries
    // newest first. Keep exactly the same summary semantics as the PDF.
    const latest = card.entries[0];
    const plans = card.plans.filter((plan) => plan.status === "active")
      .map((plan) => [
        plan.title,
        ...(plan.cycles ?? [])
          .filter((cycle) => cycle.status === "in_progress")
          .sort((a, b) => a.cycle_number - b.cycle_number)
          .map((cycle) => `${t("cycle")} ${cycle.cycle_number}: ${cycle.title}`),
      ].join("\n")).join("\n\n");
    const values = [
      `${card.first_name} ${card.last_name}`,
      card.problem || null, t(card.status), plans || null,
      latest ? new Date(`${latest.recorded_on}T00:00:00.000Z`) : null,
      latest?.therapy || null,
    ];
    const row = sheet.addRow(values);
    const lines = Math.max(...values.map((value, column) =>
      wrappedLines(value instanceof Date ? formatRehabDate(value, false, locale) : value ?? "", widths[column]),
    ));
    // 409 points is Excel's row-height limit; never truncate the stored text.
    row.height = Math.min(409, Math.max(32, lines * 16 + 12));
    row.eachCell({ includeEmpty: true }, (cell, column) => {
      cell.font = {
        name: "Arial", size: 11, bold: column === 1 || column === 3,
        color: { argb: column === 3 ? colors[`${card.status}Text`] : colors.text },
      };
      cell.alignment = { vertical: "top", wrapText: true, horizontal: column === 3 || column === 5 ? "center" : "left" };
      cell.fill = {
        type: "pattern", pattern: "solid",
        fgColor: { argb: column === 3 ? colors[`${card.status}Fill`] : index % 2 ? colors.stripe : colors.white },
      };
      cell.border = { bottom: { style: "thin", color: { argb: colors.border } } };
      // String values (including =, +, -, @ prefixes) stay literal, never formulas.
      cell.numFmt = column === 5 ? (locale === "en" ? "dd/mm/yyyy" : "dd.mm.yyyy") : "@";
    });
  });

  const lastRow = Math.max(headerRow, sheet.rowCount);
  sheet.autoFilter = `A${headerRow}:F${lastRow}`;
  sheet.pageSetup.printArea = `A1:F${lastRow}`;
  if (report.cards.length) {
    // Keep the status cue correct even if the recipient edits the status in Excel.
    sheet.addConditionalFormatting({
      ref: `C${headerRow + 1}:C${lastRow}`,
      rules: (["active", "completed"] as const).map((status, index) => ({
        type: "expression", priority: index + 1,
        formulae: [`C${headerRow + 1}="${t(status).replaceAll('"', '""')}"`],
        style: {
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: colors[`${status}Fill`] } },
          font: { bold: true, color: { argb: colors[`${status}Text`] } },
        },
      })),
    });
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

export function rehabReportXlsxFilename(report: RehabReport, locale: string) {
  const name = locale === "en" ? "rehabilitation-summary" : "rehabilitacija-pregled";
  const period = report.from && report.to
    ? `${report.from}_${report.to}`
    : locale === "en" ? "all-dates" : "svi-datumi";
  return `${name}-${period}-${locale === "en" ? "en" : "sr"}.xlsx`;
}
