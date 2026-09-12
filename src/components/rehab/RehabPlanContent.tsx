import { useTranslations } from "next-intl";
import type { RehabPlan } from "@/lib/rehab/types";
import { formatRehabDate } from "@/lib/rehab/dates";

export function RehabPlanContent({
  plan,
  locale,
}: {
  plan: RehabPlan;
  locale: string;
}) {
  const t = useTranslations("rehab");
  return (
    <div className="space-y-4 py-4">
      <p className="text-sm text-gray-500">
        {plan.format === "cycles" ? t("cyclesPlan") : t("legacyDaily")}
      </p>
      {plan.format === "cycles"
        ? [...(plan.cycles ?? [])]
            .sort((a, b) => a.cycle_number - b.cycle_number)
            .map((cycle) => (
              <section
                key={cycle.id}
                className="rehab-cycle rounded-lg border border-gray-200 p-4"
              >
                <h3 className="font-semibold text-navy">
                  {t("cycle")} {cycle.cycle_number} — {cycle.title}
                </h3>
                <p className="my-2 text-xs text-gray-600">
                  {t(cycle.status)} ·{" "}
                  {cycle.start_date
                    ? formatRehabDate(cycle.start_date, false, locale)
                    : t("noDate")}{" "}
                  –{" "}
                  {cycle.end_date
                    ? formatRehabDate(cycle.end_date, false, locale)
                    : t("openEnd")}
                </p>
                {cycle.goal && (
                  <p className="mb-2 whitespace-pre-wrap text-sm">
                    <strong>{t("cycleGoal")}: </strong>
                    {cycle.goal}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {cycle.instructions}
                </p>
              </section>
            ))
        : [...(plan.days ?? [])]
            .sort((a, b) => a.day_number - b.day_number)
            .map((day) => (
              <section
                key={day.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <h3 className="font-semibold">
                  {t("day")} {day.day_number} ·{" "}
                  {day.planned_date
                    ? formatRehabDate(day.planned_date, false, locale)
                    : t("noDate")}
                </h3>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                  {day.instructions}
                </p>
              </section>
            ))}
    </div>
  );
}
