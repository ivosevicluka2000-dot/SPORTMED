import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { PrintPlanButton } from "@/components/rehab/PrintPlanButton";
import { RehabPainBadge, rehabPatientUrl } from "@/components/rehab/RehabUi";
import type { Locale } from "@/i18n/routing";
import { getRehabAccessContext, selectRehabWorkspace } from "@/lib/rehab/access";
import { formatRehabDate } from "@/lib/rehab/dates";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface ReportPatient {
  id: string;
  record_type: "patient" | "player";
  first_name: string;
  last_name: string;
  problem: string | null;
  started_on: string;
  status: "active" | "completed";
}

interface ReportEntry {
  id: string;
  recorded_on: string;
  condition_summary: string;
  pain_level: number | null;
  therapy: string;
  notes: string | null;
  created_by: string;
}

export default async function PrintRehabPatientReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ workspace?: string }>;
}) {
  const t = await getTranslations("rehab");
  const [{ locale: rawLocale, id }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;

  const supabase = await createClient();
  const [patientResult, entriesResult, activePlanResult, nextAppointmentResult] = await Promise.all([
    supabase
      .from("rehab_patients")
      .select("id, record_type, first_name, last_name, problem, started_on, status")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("rehab_daily_entries")
      .select("id, recorded_on, condition_summary, pain_level, therapy, notes, created_by")
      .eq("patient_id", id)
      .eq("workspace_id", workspace.id)
      .order("recorded_on", { ascending: false })
      .limit(5),
    supabase
      .from("rehab_plans")
      .select("id, title, start_date, end_date, goal")
      .eq("patient_id", id)
      .eq("workspace_id", workspace.id)
      .eq("status", "active")
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("rehab_appointments")
      .select("id, starts_at, therapy")
      .eq("patient_id", id)
      .eq("workspace_id", workspace.id)
      .eq("status", "scheduled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!patientResult.data) notFound();
  const patient = patientResult.data as ReportPatient;
  const entries = (entriesResult.data ?? []) as ReportEntry[];
  const creatorIds = [...new Set(entries.map((entry) => entry.created_by))];
  const admin = createAdminClient();
  const { data: creators } = creatorIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", creatorIds)
    : { data: [] as Array<{ id: string; full_name: string | null }> };
  const creatorNameById = new Map(
    (creators ?? []).map((creator) => [creator.id, creator.full_name || t("labelTeamMember")])
  );
  const activePlan = activePlanResult.data;
  const nextAppointment = nextAppointmentResult.data;

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
                <Image src="/logo.png" alt="Sport Care & Med" width={190} height={37} className="h-auto w-44" priority />
                <p className="mt-2 text-xs text-gray-500">{t("labelSportsMedicineAndRehabilitationCentreAbac")}</p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-amber-100 p-2.5 text-amber-700"><Trophy className="h-6 w-6" /></span>
                <div>
                  <p className="text-lg font-semibold text-navy">{workspace.name}</p>
                  <p className="text-xs text-gray-500">{t("labelClubRehabilitation")}</p>
                </div>
              </div>
            )}
            <div className="text-right text-xs text-gray-500">
              <p className="font-semibold uppercase tracking-[0.15em] text-teal-dark">{t("labelRehabPlatform")}</p>
              <p className="mt-1">{t("labelReportDate")} {formatRehabDate(new Date(), false, locale)}</p>
            </div>
          </div>
          <h1 className="font-heading text-3xl font-semibold text-navy">{t("labelBriefRehabilitationReport")}</h1>
        </header>

        <section className="grid gap-4 border-b border-gray-200 py-5 sm:grid-cols-2">
          <ReportField label={patient.record_type === "player" ? t("labelPlayer") : t("labelPatient")} value={`${patient.first_name} ${patient.last_name}`} />
          <ReportField label={t("labelStatus")} value={patient.status === "active" ? t("labelActive") : t("labelCompleted")} />
          <ReportField label={t("labelProblemInjury")} value={patient.problem || "—"} />
          <ReportField label={t("labelRehabilitationStarted")} value={formatRehabDate(patient.started_on, false, locale)} />
          <ReportField
            label={t("labelActivePlan")}
            value={activePlan ? `${activePlan.title} · ${formatRehabDate(activePlan.start_date, false, locale)} – ${formatRehabDate(activePlan.end_date, false, locale)}` : t("labelNoActivePlan")}
          />
          <ReportField
            label={t("labelNextAppointment")}
            value={nextAppointment ? `${formatRehabDate(nextAppointment.starts_at, true, locale)}${nextAppointment.therapy ? ` · ${nextAppointment.therapy}` : ""}` : t("labelNoScheduledAppointment")}
          />
        </section>

        <section className="py-6">
          <h2 className="mb-4 font-heading text-xl font-semibold text-navy">{t("labelLastFiveTherapies")}</h2>
          {entries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">{t("labelNoTherapiesRecordedYet")}</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <article key={entry.id} className="break-inside-avoid rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-navy">{formatRehabDate(entry.recorded_on, false, locale)}</p>
                    {entry.pain_level !== null && <RehabPainBadge value={entry.pain_level} />}
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-700">{entry.condition_summary}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{entry.therapy}</p>
                  {entry.notes && <p className="mt-2 text-sm italic text-gray-500">{entry.notes}</p>}
                  <p className="mt-3 text-xs text-gray-400">{t("labelEnteredBy")} {creatorNameById.get(entry.created_by) ?? t("labelTeamMember")}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-gray-400">{t("labelReportPreparedBy")}</p>
          <p className="mt-1 font-semibold text-navy">{access.fullName}</p>
        </section>

        <footer className="mt-12 grid gap-10 pt-6 text-sm sm:grid-cols-2">
          <div className="border-t border-gray-400 pt-2 text-gray-500">{t("labelReviewDate")}</div>
          <div className="border-t border-gray-400 pt-2 text-gray-500">{t("labelTherapistSignature")}</div>
        </footer>
      </article>
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{value}</p>
    </div>
  );
}
