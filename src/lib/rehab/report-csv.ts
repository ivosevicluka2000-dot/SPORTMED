import { formatRehabDate } from "./dates.ts";
import type { RehabReport } from "./reports";

type ReportCsvLabel =
  | "player"
  | "patient"
  | "problem"
  | "currentStatus"
  | "activePlansCycles"
  | "lastTherapyDate"
  | "lastTherapy"
  | "active"
  | "completed"
  | "cycle";

function csvCell(value: string) {
  // Keep each person on one line and prevent entered text becoming an Excel formula.
  const text = value.replace(/\s+/g, " ").trim();
  const literal = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${literal.replace(/"/g, '""')}"`;
}

export function rehabReportCsv(
  report: RehabReport,
  locale: string,
  t: (key: ReportCsvLabel) => string,
): string {
  const rows = [
    [
      t(report.workspace.kind === "club" ? "player" : "patient"),
      t("problem"),
      t("currentStatus"),
      t("activePlansCycles"),
      t("lastTherapyDate"),
      t("lastTherapy"),
    ],
    ...report.cards.map((card) => {
      // The authenticated report loader already applies the selection/period and
      // orders entries newest first, just as the PDF summary expects.
      const latest = card.entries[0];
      return [
        `${card.first_name} ${card.last_name}`,
        card.problem ?? "",
        t(card.status),
        card.plans
          .filter((plan) => plan.status === "active")
          .map((plan) => {
            const cycles = (plan.cycles ?? [])
              .filter((cycle) => cycle.status === "in_progress")
              .sort((a, b) => a.cycle_number - b.cycle_number)
              .map((cycle) => `${t("cycle")} ${cycle.cycle_number}: ${cycle.title}`);
            return [plan.title, ...cycles].join("; ");
          })
          .join("; "),
        latest ? formatRehabDate(latest.recorded_on, false, locale) : "",
        latest?.therapy ?? "",
      ];
    }),
  ];
  // UTF-8 BOM makes Serbian characters readable when opening the CSV in Excel.
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function rehabReportCsvFilename(report: RehabReport, locale: string) {
  const name = locale === "en" ? "rehabilitation-summary" : "rehabilitacija-pregled";
  const period = report.from && report.to
    ? `${report.from}_${report.to}`
    : locale === "en" ? "all-dates" : "svi-datumi";
  return `${name}-${period}-${locale === "en" ? "en" : "sr"}.csv`;
}
