import { CalendarCheck, CheckCircle2, ClipboardList, FileText, UserRound } from "lucide-react";
import { savePeriodSummaryAction } from "@/app/[locale]/admin/rehab/_actions";
import { createClient } from "@/lib/supabase/server";
import { getRehabAccessContext, selectRehabWorkspace } from "@/lib/rehab/access";
import { dateInputValue, localBelgradeDateTimeToIso, monthInputValue } from "@/lib/rehab/dates";
import type { Locale } from "@/i18n/routing";
import {
  RehabAlert,
  RehabPageHeader,
  RehabPanel,
  WorkspaceTabs,
  rehabInputClass,
  rehabLabelClass,
} from "@/components/rehab/RehabUi";
import { RehabForm } from "@/components/rehab/RehabForm";
import { RehabSubmitButton } from "@/components/rehab/RehabSubmitButton";

export const dynamic = "force-dynamic";

export default async function RehabReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    workspace?: string;
    type?: string;
    period?: string;
    error?: string;
    saved?: string;
  }>;
}) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;

  const periodType = query.type === "year" ? "year" : "month";
  const currentYear = dateInputValue().slice(0, 4);
  const period = periodType === "year"
    ? /^\d{4}$/.test(query.period ?? "")
      ? query.period!
      : currentYear
    : /^\d{4}-(0[1-9]|1[0-2])$/.test(query.period ?? "")
      ? query.period!
      : monthInputValue();
  const { startDate, endDate, startIso, endIso } = periodBounds(periodType, period);

  const supabase = await createClient();
  const [activePatients, completedPatients, entries, appointments, plans, summary] = await Promise.all([
    supabase
      .from("rehab_patients")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("status", "active"),
    supabase
      .from("rehab_patients")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .gte("completed_at", startIso)
      .lt("completed_at", endIso),
    supabase
      .from("rehab_daily_entries")
      .select("patient_id", { count: "exact" })
      .eq("workspace_id", workspace.id)
      .gte("recorded_on", startDate)
      .lt("recorded_on", endDate),
    supabase
      .from("rehab_appointments")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .gte("starts_at", startIso)
      .lt("starts_at", endIso)
      .neq("status", "cancelled"),
    supabase
      .from("rehab_plans")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .gte("start_date", startDate)
      .lt("start_date", endDate),
    supabase
      .from("rehab_period_summaries")
      .select("conclusion")
      .eq("workspace_id", workspace.id)
      .eq("period_type", periodType)
      .eq("period_start", startDate)
      .maybeSingle(),
  ]);

  const uniquePatients = new Set(
    ((entries.data ?? []) as Array<{ patient_id: string }>).map((entry) => entry.patient_id)
  ).size;
  const stats = [
    { label: "Aktivni kartoni", value: activePatients.count ?? 0, icon: UserRound },
    { label: "Završene rehabilitacije", value: completedPatients.count ?? 0, icon: CheckCircle2 },
    { label: "Kartoni sa terapijom", value: uniquePatients, icon: FileText },
    { label: "Dnevni unosi", value: entries.count ?? 0, icon: ClipboardList },
    { label: "Održani / zakazani termini", value: appointments.count ?? 0, icon: CalendarCheck },
    { label: "Novi planovi", value: plans.count ?? 0, icon: ClipboardList },
  ];

  return (
    <div>
      <RehabPageHeader
        eyebrow={workspace.name}
        title="Mesečni i godišnji pregled"
        description="Automatski brojevi iz evidencije i zaključak koji ostaje sačuvan uz izabrani period."
      />
      <WorkspaceTabs
        access={access}
        selectedId={workspace.id}
        locale={locale}
        href="/rehab/izvestaji"
        query={{ type: periodType, period }}
      />
      <RehabAlert error={query.error} saved={query.saved} />

      <RehabPanel className="mb-6">
        <form method="get" className="grid gap-4 sm:grid-cols-[180px_220px_auto] sm:items-end">
          <input type="hidden" name="workspace" value={workspace.id} />
          <label>
            <span className={rehabLabelClass}>Vrsta pregleda</span>
            <select name="type" defaultValue={periodType} className={rehabInputClass}>
              <option value="month">Mesečni</option>
              <option value="year">Godišnji</option>
            </select>
          </label>
          <label>
            <span className={rehabLabelClass}>Period</span>
            {periodType === "year" ? (
              <input name="period" type="number" min={2020} max={2100} defaultValue={period} className={rehabInputClass} />
            ) : (
              <input name="period" type="month" defaultValue={period} className={rehabInputClass} />
            )}
          </label>
          <button className="rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900">
            Prikaži pregled
          </button>
        </form>
      </RehabPanel>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <RehabPanel key={stat.label} className="p-4 md:p-5">
              <Icon className="mb-3 h-5 w-5 text-teal-dark" />
              <p className="text-2xl font-semibold text-navy">{stat.value}</p>
              <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
            </RehabPanel>
          );
        })}
      </div>

      <RehabPanel>
        <h2 className="font-heading text-2xl font-semibold text-navy">
          Zaključak za {periodType === "year" ? period : formatMonth(period)}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Ovde se upisuje kratak zaključak o radu, stanju pacijenata ili igrača i planu za naredni period.
        </p>
        {workspace.canEdit ? (
          <RehabForm action={savePeriodSummaryAction} className="mt-5 space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="workspace_id" value={workspace.id} />
            <input type="hidden" name="period_type" value={periodType} />
            <input type="hidden" name="period" value={period} />
            <textarea
              name="conclusion"
              rows={8}
              maxLength={10000}
              defaultValue={summary.data?.conclusion ?? ""}
              className={rehabInputClass}
              placeholder="Upišite zaključak..."
            />
            <RehabSubmitButton className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
              Sačuvaj zaključak
            </RehabSubmitButton>
          </RehabForm>
        ) : (
          <div className="mt-5 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            {summary.data?.conclusion || "Zaključak još nije unet."}
          </div>
        )}
      </RehabPanel>
    </div>
  );
}

function periodBounds(type: "month" | "year", period: string) {
  const [yearText, monthText] = period.split("-");
  const year = Number(yearText);
  const month = type === "year" ? 1 : Number(monthText);
  const next = type === "year"
    ? new Date(Date.UTC(year + 1, 0, 1, 12))
    : new Date(Date.UTC(year, month, 1, 12));
  const startDate = type === "year" ? `${year}-01-01` : `${yearText}-${monthText}-01`;
  const endDate = next.toISOString().slice(0, 10);
  return {
    startDate,
    endDate,
    startIso: localBelgradeDateTimeToIso(`${startDate}T00:00`),
    endIso: localBelgradeDateTimeToIso(`${endDate}T00:00`),
  };
}

function formatMonth(period: string) {
  return new Intl.DateTimeFormat("sr-RS", { month: "long", year: "numeric" }).format(
    new Date(`${period}-15T12:00:00Z`)
  );
}
