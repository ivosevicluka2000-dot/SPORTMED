import { getTranslations } from "next-intl/server";
import type { RehabPlan } from "@/lib/rehab/types";
import { RehabPlanContent } from "@/components/rehab/RehabPlanContent";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { PrintPlanButton } from "@/components/rehab/PrintPlanButton";
import { rehabPatientUrl } from "@/components/rehab/RehabUi";
import type { Locale } from "@/i18n/routing";
import { getRehabAccessContext, selectRehabWorkspace } from "@/lib/rehab/access";
import { formatRehabDate } from "@/lib/rehab/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PrintPatient {
  id: string;
  first_name: string;
  last_name: string;
  record_type: "patient" | "player";
  problem: string | null;
}

export default async function PrintRehabPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string; planId: string }>;
  searchParams: Promise<{ workspace?: string }>;
}) {
  const t = await getTranslations("rehab");
  const [{ locale: rawLocale, id, planId }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;

  const supabase = await createClient();
  const [patientResult, planResult] = await Promise.all([
    supabase
      .from("rehab_patients")
      .select("id, first_name, last_name, record_type, problem")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("rehab_plans")
      .select("id, title, start_date, end_date, goal, notes, status, format, cycles:rehab_plan_cycles(*), days:rehab_plan_days(id, day_number, planned_date, instructions)")
      .eq("id", planId)
      .eq("patient_id", id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
  ]);

  if (!patientResult.data || !planResult.data) notFound();
  const patient = patientResult.data as PrintPatient;
  const rawPlan = planResult.data as unknown as RehabPlan;
  const plan = {
    ...rawPlan,
    days: [...(rawPlan.days ?? [])].sort((a, b) => a.day_number - b.day_number),
  };

  return (
    <div className="rehab-print-page">
      <div className="rehab-print-toolbar mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={rehabPatientUrl(locale, patient.id, { workspace: workspace.id })}
          className="rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
        >
           {t("labelBackToRecord")} </Link>
        <PrintPlanButton />
      </div>

      <article className="rehab-print-sheet mx-auto max-w-4xl bg-white p-6 text-gray-900 sm:p-10">
        <header className="border-b-2 border-navy pb-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            {workspace.kind === "clinic" ? (
              <div>
                <Image
                  src="/logo.png"
                  alt="Sport Care & Med"
                  width={190}
                  height={37}
                  className="h-auto w-44"
                  priority
                />
                <p className="mt-2 text-xs text-gray-500">{t("labelSportsMedicineAndRehabilitationCentreAbac")}</p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
                  <Trophy className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-navy">{workspace.name}</p>
                  <p className="text-xs text-gray-500">{t("labelClubRehabilitation")}</p>
                </div>
              </div>
            )}
            <div className="text-right text-xs text-gray-500">
              <p className="font-semibold uppercase tracking-[0.15em] text-teal-dark">{t("labelRehabPlatform")}</p>
              <p className="mt-1">{t("labelPrintDate")} {formatRehabDate(new Date(), false, locale)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-heading text-3xl font-semibold text-navy">{plan.title}</h1>
              <p className="mt-1 text-sm text-gray-500">{t("labelRehabilitationPlan")}</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {plan.status === "active" ? t("labelActive") : t("labelCompleted")}
            </span>
          </div>
        </header>

        <section className="grid gap-4 border-b border-gray-200 py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {patient.record_type === "player" ? t("labelPlayer") : t("labelPatient")}
            </p>
            <p className="mt-1 text-base font-semibold text-navy">
              {patient.first_name} {patient.last_name}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t("labelPeriod")}</p>
            <p className="mt-1 text-sm text-gray-700">
              {formatRehabDate(plan.start_date, false, locale)} – {formatRehabDate(plan.end_date, false, locale)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t("labelProblemInjury")}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{patient.problem || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t("labelPlanGoal")}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{plan.goal || "—"}</p>
          </div>
        </section>

        <RehabPlanContent plan={plan} locale={locale} />

        {plan.notes && (
          <section className="border-t border-gray-200 py-5">
            <h2 className="text-sm font-semibold text-navy">{t("labelNotes")}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{plan.notes}</p>
          </section>
        )}

        <section className="mt-6 rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">{t("labelPlanPreparedBy")}</p>
          <p className="mt-1 font-semibold text-navy">{access.fullName}</p>
          {workspace.kind === "clinic" && (
            <p className="mt-1 text-xs text-gray-500">{t("labelInfoSportcaremedComAbac")}</p>
          )}
        </section>

        <footer className="mt-12 grid gap-10 pt-6 text-sm sm:grid-cols-2">
          <div className="border-t border-gray-400 pt-2 text-gray-500">{t("labelReviewDate")}</div>
          <div className="border-t border-gray-400 pt-2 text-gray-500">{t("labelTherapistSignature")}</div>
        </footer>
      </article>
    </div>
  );
}
