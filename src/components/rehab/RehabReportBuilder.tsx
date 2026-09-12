"use client";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { loadRehabReport } from "@/lib/rehab/report-actions";
import type {
  RehabReport,
  ReportPerson,
  ReportRequest,
} from "@/lib/rehab/reports";
import { reportRequestSchema } from "@/lib/rehab/reports";
import { dateInputValue } from "@/lib/rehab/dates";
import { RehabReportDocument } from "./RehabReportDocument";
import { rehabInputClass } from "./RehabUi";
import { RehabLanguageSwitcher } from "./RehabLanguageSwitcher";

export function RehabReportBuilder({
  locale,
  workspaceId,
  people,
  kind,
  initialPatientId,
  playerOnly = false,
  initialPeriod,
  initialType,
}: {
  locale: string;
  workspaceId: string;
  people: ReportPerson[];
  kind: "clinic" | "club";
  initialPatientId?: string;
  playerOnly?: boolean;
  initialPeriod?: string;
  initialType?: string;
}) {
  const t = useTranslations("rehab");
  const today = dateInputValue();
  const [request, setRequest] = useState<ReportRequest>({
    workspaceId,
    scope: initialPatientId ? "one" : "all",
    ids: initialPatientId ? [initialPatientId] : [],
    status: "all",
    period: initialPeriod ? (initialType === "year" ? "year" : "month") : "all",
    month:
      initialType !== "year" && initialPeriod
        ? initialPeriod
        : today.slice(0, 7),
    year:
      initialType === "year" && initialPeriod
        ? initialPeriod
        : today.slice(0, 4),
    from: today,
    to: today,
    content: initialPatientId ? "individual" : "both",
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [report, setReport] = useState<RehabReport | null>(null);
  const [error, setError] = useState("");
  const [busy, startTransition] = useTransition();
  const storageKey = `rehab-report-selection:${workspaceId}:${initialPatientId ?? "all"}:${initialPeriod ?? "all"}`;
  useEffect(() => {
    if (playerOnly) return;
    // Restore browser-only print options once after hydration.
    try {
      const parsed = reportRequestSchema.safeParse(
        JSON.parse(sessionStorage.getItem(storageKey) || "null"),
      );
      if (parsed.success && parsed.data.workspaceId === workspaceId)
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate browser-only saved print options.
        setRequest(parsed.data);
    } catch {
      /* Storage may be disabled. */
    }
  }, [storageKey, workspaceId, initialPatientId, initialPeriod, playerOnly]);
  function change(patch: Partial<ReportRequest>) {
    const next = { ...request, ...patch };
    setRequest(next);
    setReport(null);
    setError("");
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* Optional draft persistence. */
    }
  }
  const matching = people.filter(
    (p) =>
      (request.status === "all" || p.status === request.status) &&
      `${p.first_name} ${p.last_name}`
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const visible = matching.slice(page * 30, (page + 1) * 30);
  const count = people.filter(
    (p) =>
      (request.status === "all" || p.status === request.status) &&
      (request.scope === "all" || request.ids.includes(p.id)),
  ).length;
  return (
    <div className="rehab-report-builder">
      <form
        className="rehab-print-toolbar mb-6 rounded-xl border bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setReport(null);
          setError("");
          startTransition(async () => {
            try {
              const result = await loadRehabReport(locale, request);
              if (result.report) setReport(result.report);
              else setError(result.error);
            } catch {
              setError("reportLoadError");
            }
          });
        }}
      >
        <fieldset disabled={busy} className="space-y-4">
          <div className="flex flex-wrap justify-between gap-4">
            <h2 className="text-xl font-semibold">{t("chooseReport")}</h2>
            <RehabLanguageSwitcher />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm">
              {t("scope")}
              <select
                aria-label={t("scope")}
                className={rehabInputClass}
                value={request.scope}
                disabled={playerOnly}
                onChange={(e) => {
                  const scope = e.target.value as ReportRequest["scope"];
                  change({
                    scope,
                    ids:
                      scope === "one" ? request.ids.slice(0, 1) : request.ids,
                    content: scope === "one" ? "individual" : "both",
                  });
                }}
              >
                <option value="one">
                  {t(kind === "club" ? "onePlayer" : "onePatient")}
                </option>
                <option value="selected">{t("selectedPeople")}</option>
                <option value="all">
                  {t(kind === "club" ? "wholeClub" : "allPatients")}
                </option>
              </select>
            </label>
            <label className="text-sm">
              {t("cardStatus")}
              <select
                aria-label={t("cardStatus")}
                className={rehabInputClass}
                value={request.status}
                onChange={(e) => {
                  setPage(0);
                  change({ status: e.target.value as ReportRequest["status"] });
                }}
              >
                {["all", "active", "completed"].map((s) => (
                  <option value={s} key={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              {t("reportContent")}
              <select
                aria-label={t("reportContent")}
                className={rehabInputClass}
                value={request.content}
                onChange={(e) =>
                  change({
                    content: e.target.value as ReportRequest["content"],
                  })
                }
              >
                <option value="summary">{t("summaryReport")}</option>
                <option value="individual">{t("individualReports")}</option>
                <option value="both">{t("bothReports")}</option>
              </select>
            </label>
          </div>
          {request.scope !== "all" && !playerOnly && (
            <div className="rounded-lg border p-3">
              <label className="text-sm">
                {t("searchPeople")}
                <input
                  className={rehabInputClass}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
              <div className="my-3 grid gap-2 sm:grid-cols-2">
                {visible.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 rounded border p-2 text-sm"
                  >
                    <input
                      type={request.scope === "one" ? "radio" : "checkbox"}
                      name={request.scope === "one" ? "person" : undefined}
                      checked={request.ids.includes(p.id)}
                      onChange={(e) =>
                        change({
                          ids:
                            request.scope === "one"
                              ? [p.id]
                              : e.target.checked
                                ? [...request.ids, p.id]
                                : request.ids.filter((id) => id !== p.id),
                        })
                      }
                    />
                    {p.first_name} {p.last_name} · {t(p.status)}
                  </label>
                ))}
              </div>
              {!matching.length && (
                <p className="text-sm">{t("noReportPeople")}</p>
              )}
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t("previous")}
                </button>
                <span>
                  {page + 1} / {Math.max(1, Math.ceil(matching.length / 30))}
                </span>
                <button
                  type="button"
                  disabled={(page + 1) * 30 >= matching.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("next")}
                </button>
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm">
              {t("period")}
              <select
                aria-label={t("period")}
                className={rehabInputClass}
                value={request.period}
                onChange={(e) =>
                  change({ period: e.target.value as ReportRequest["period"] })
                }
              >
                {["all", "month", "year", "range"].map((p) => (
                  <option key={p} value={p}>
                    {t(p === "all" ? "allDates" : p)}
                  </option>
                ))}
              </select>
            </label>
            {request.period === "month" && (
              <label className="text-sm">
                {t("month")}
                <input
                  required
                  type="month"
                  className={rehabInputClass}
                  value={request.month}
                  onChange={(e) => change({ month: e.target.value })}
                />
              </label>
            )}
            {request.period === "year" && (
              <label className="text-sm">
                {t("year")}
                <input
                  required
                  type="number"
                  min={1900}
                  max={2100}
                  className={rehabInputClass}
                  value={request.year}
                  onChange={(e) => change({ year: e.target.value })}
                />
              </label>
            )}
            {request.period === "range" && (
              <>
                <label className="text-sm">
                  {t("from")}
                  <input
                    required
                    type="date"
                    className={rehabInputClass}
                    value={request.from}
                    onChange={(e) => change({ from: e.target.value })}
                  />
                </label>
                <label className="text-sm">
                  {t("to")}
                  <input
                    required
                    type="date"
                    min={request.from}
                    className={rehabInputClass}
                    value={request.to}
                    onChange={(e) => change({ to: e.target.value })}
                  />
                </label>
              </>
            )}
          </div>
          <p className="text-sm font-semibold" aria-live="polite">
            {t("peopleCount", { count })} · {t("currentStatus")}:{" "}
            {t(request.status)}
          </p>
          <button
            disabled={busy || !count}
            className="rounded-md bg-navy px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? t("loadingReport") : t("previewReport")}
          </button>
        </fieldset>
      </form>
      {error && (
        <p
          role="alert"
          className="rehab-print-toolbar mb-6 rounded border border-red-200 bg-red-50 p-4 text-red-700"
        >
          {t(error)}
        </p>
      )}
      {report && (
        <>
          <div className="rehab-print-toolbar mb-5 flex items-center gap-4">
            <span>{t("peopleCount", { count: report.cards.length })}</span>
            <button
              onClick={() => window.print()}
              className="rounded-md bg-navy px-5 py-3 text-white"
            >
              {t("printPdf")}
            </button>
            <RehabLanguageSwitcher />
          </div>
          <RehabReportDocument report={report} locale={locale} />
        </>
      )}
    </div>
  );
}
