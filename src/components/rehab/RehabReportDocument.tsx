"use client";
import { useTranslations } from "next-intl";
import type { RehabReport } from "@/lib/rehab/reports";
import { formatRehabDate } from "@/lib/rehab/dates";
import { RehabPlanContent } from "./RehabPlanContent";

function summaryExcerpt(text: string | null) {
  const chars = Array.from(text?.trim() || "—");
  return chars.length > 180
    ? `${chars.slice(0, 180).join("").trimEnd()}…`
    : chars.join("");
}

export function RehabReportDocument({
  report,
  locale,
}: {
  report: RehabReport;
  locale: string;
}) {
  const t = useTranslations("rehab");
  const date = (v: string | null) => formatRehabDate(v, false, locale);
  const heading = (
    <header className="mb-6 border-b-2 border-navy pb-4">
      <p className="text-lg font-semibold">{report.workspace.name}</p>
      <h1 className="mt-2 text-2xl font-semibold">
        {t("rehabilitationReport")}
      </h1>
      <p className="mt-2 text-sm">
        {report.from
          ? `${date(report.from)} – ${date(report.to)}`
          : t("allDates")}{" "}
        · {t("peopleCount", { count: report.cards.length })}
      </p>
      <p className="mt-1 text-xs text-gray-600">
        {t("generatedOn")}: {date(report.generatedAt)} · {t("preparedBy")}:{" "}
        {report.preparedBy}
      </p>
    </header>
  );
  return (
    <div className="rehab-report-document text-gray-900">
      {report.content !== "individual" && (
        <article className="rehab-report-person rehab-print-sheet mx-auto mb-6 max-w-5xl bg-white p-6 sm:p-10">
          {heading}
          <h2 className="mb-4 text-xl font-semibold">{t("summaryReport")}</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead>
                <tr>
                  {[
                    report.workspace.kind === "club" ? "player" : "patient",
                    "problem",
                    "currentStatus",
                    "activePlansCycles",
                    "lastTherapy",
                  ].map((key) => (
                    <th key={key} className="border-b p-2 align-top">
                      {t(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.cards.map((card) => (
                  <tr key={card.id}>
                    <td className="border-b p-2 align-top">
                      {card.first_name} {card.last_name}
                    </td>
                    <td className="border-b p-2 align-top whitespace-pre-wrap">
                      {summaryExcerpt(card.problem)}
                    </td>
                    <td className="border-b p-2 align-top">{t(card.status)}</td>
                    <td className="border-b p-2 align-top">
                      {card.plans
                        .filter((p) => p.status === "active")
                        .map((p) => (
                          <div key={p.id} className="mb-2">
                            <strong>{p.title}</strong>
                            {p.cycles
                              ?.filter((c) => c.status === "in_progress")
                              .sort((a, b) => a.cycle_number - b.cycle_number)
                              .map((c) => (
                                <p key={c.id}>
                                  {t("cycle")} {c.cycle_number}: {c.title}
                                </p>
                              ))}
                          </div>
                        ))}
                    </td>
                    <td className="border-b p-2 align-top">
                      {card.entries[0] ? (
                        <>
                          {date(card.entries[0].recorded_on)}
                          <p className="whitespace-pre-wrap">
                            {summaryExcerpt(card.entries[0].therapy)}
                          </p>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            {t("summaryExcerptNote")}
          </p>
        </article>
      )}
      {report.content !== "summary" &&
        report.cards.map((card) => (
          <article
            key={card.id}
            className="rehab-report-person rehab-print-sheet mx-auto mb-6 max-w-5xl bg-white p-6 sm:p-10"
          >
            {heading}
            <h2 className="text-2xl font-semibold">
              {card.first_name} {card.last_name}
            </h2>
            <p className="my-2 text-sm">
              {t("currentStatus")}: {t(card.status)} · {t("start")}:{" "}
              {date(card.started_on)}
            </p>
            <p className="mb-6 whitespace-pre-wrap">{card.problem}</p>
            <h2 className="mb-3 text-xl font-semibold">{t("plans")}</h2>
            {!card.plans.length && <p>{t("noPlans")}</p>}
            {card.plans.map((plan) => (
              <section key={plan.id} className="mb-6">
                <h3 className="font-semibold">
                  {plan.title} · {t(plan.status)}
                </h3>
                <p className="my-2 text-sm">
                  {date(plan.start_date)} –{" "}
                  {plan.end_date ? date(plan.end_date) : t("openEnd")}
                </p>
                {plan.goal && (
                  <p className="whitespace-pre-wrap text-sm">
                    {t("planGoal")}: {plan.goal}
                  </p>
                )}
                <RehabPlanContent plan={plan} locale={locale} />
                {plan.notes && (
                  <p className="whitespace-pre-wrap text-sm">
                    {t("notes")}: {plan.notes}
                  </p>
                )}
              </section>
            ))}
            <h2 className="mb-3 text-xl font-semibold">
              {t("recordedTherapies")}
            </h2>
            {!card.entries.length && <p>{t("noTherapies")}</p>}
            {card.entries.map((entry) => (
              <section key={entry.id} className="mb-4 border-t pt-3 text-sm">
                <h3 className="font-semibold">
                  {date(entry.recorded_on)}
                  {entry.pain_level !== null &&
                    ` · ${t("pain")}: ${entry.pain_level}/10`}
                </h3>
                <p className="mt-2 whitespace-pre-wrap">
                  {entry.condition_summary}
                </p>
                <p className="mt-2 whitespace-pre-wrap">{entry.therapy}</p>
                {entry.notes && (
                  <p className="mt-2 whitespace-pre-wrap italic">
                    {entry.notes}
                  </p>
                )}
              </section>
            ))}
            <footer className="mt-10 grid grid-cols-2 gap-8 text-sm">
              <p className="border-t pt-2">{t("reviewDate")}</p>
              <p className="border-t pt-2">{t("therapistSignature")}</p>
            </footer>
          </article>
        ))}
    </div>
  );
}
