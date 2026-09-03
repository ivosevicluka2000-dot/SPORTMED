import Link from "next/link";
import { AlertTriangle, CalendarDays, ClipboardList, HeartPulse, UserRound } from "lucide-react";
import { getRehabAccessContext, selectRehabWorkspace } from "@/lib/rehab/access";
import {
  dateInputValue,
  formatRehabDate,
  localBelgradeDateTimeToIso,
} from "@/lib/rehab/dates";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import {
  EmptyState,
  RehabPageHeader,
  RehabPanel,
  WorkspaceTabs,
  rehabPatientUrl,
  rehabUrl,
} from "@/components/rehab/RehabUi";

export const dynamic = "force-dynamic";

export default async function RehabDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ workspace?: string }>;
}) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;

  const supabase = await createClient();
  const today = dateInputValue();
  const tomorrowDate = new Date(`${today}T12:00:00Z`);
  tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
  const tomorrow = tomorrowDate.toISOString().slice(0, 10);
  const todayStart = localBelgradeDateTimeToIso(`${today}T00:00`);
  const tomorrowStart = localBelgradeDateTimeToIso(`${tomorrow}T00:00`);
  const sevenDaysAgoDate = new Date(`${today}T12:00:00Z`);
  sevenDaysAgoDate.setUTCDate(sevenDaysAgoDate.getUTCDate() - 7);
  const sevenDaysAgo = sevenDaysAgoDate.toISOString().slice(0, 10);

  const [patients, plans, appointments, recentEntries, upcomingAppointments, recentPatientEntries] =
    await Promise.all([
      supabase
        .from("rehab_patients")
        .select("id, first_name, last_name, started_on", { count: "exact" })
        .eq("workspace_id", workspace.id)
        .eq("status", "active")
        .order("last_name", { ascending: true })
        .limit(500),
      supabase
        .from("rehab_plans")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("status", "active"),
      supabase
        .from("rehab_appointments")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspace.id)
        .eq("status", "scheduled")
        .gte("starts_at", todayStart)
        .lt("starts_at", tomorrowStart),
      supabase
        .from("rehab_daily_entries")
        .select(
          "id, recorded_on, condition_summary, therapy, patient:rehab_patients(id, first_name, last_name)"
        )
        .eq("workspace_id", workspace.id)
        .order("recorded_on", { ascending: false })
        .limit(5),
      supabase
        .from("rehab_appointments")
        .select(
          "id, starts_at, therapy, patient:rehab_patients(id, first_name, last_name)"
        )
        .eq("workspace_id", workspace.id)
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(5),
      supabase
        .from("rehab_daily_entries")
        .select("patient_id")
        .eq("workspace_id", workspace.id)
        .gte("recorded_on", sevenDaysAgo)
        .limit(2000),
    ]);

  type EntryRow = {
    id: string;
    recorded_on: string;
    condition_summary: string;
    therapy: string;
    patient: { id: string; first_name: string; last_name: string } | null;
  };
  type AppointmentRow = {
    id: string;
    starts_at: string;
    therapy: string | null;
    patient: { id: string; first_name: string; last_name: string } | null;
  };
  type ActivePatientRow = {
    id: string;
    first_name: string;
    last_name: string;
    started_on: string;
  };

  const recentlyUpdatedPatientIds = new Set(
    ((recentPatientEntries.data ?? []) as Array<{ patient_id: string }>).map(
      (entry) => entry.patient_id
    )
  );
  const patientsNeedingAttention = ((patients.data ?? []) as ActivePatientRow[]).filter(
    (patient) => !recentlyUpdatedPatientIds.has(patient.id)
  );

  const stats = [
    { label: workspace.kind === "club" ? "Aktivni igrači" : "Aktivni pacijenti", value: patients.count ?? 0, icon: UserRound },
    { label: "Aktivni planovi", value: plans.count ?? 0, icon: ClipboardList },
    { label: "Današnji termini", value: appointments.count ?? 0, icon: CalendarDays },
    { label: "Bez unosa 7 dana", value: patientsNeedingAttention.length, icon: AlertTriangle },
  ];

  return (
    <div>
      <RehabPageHeader
        eyebrow="Interni admin modul"
        title="Evidencija rehabilitacije"
        description="Klinika i klub su odvojeni. Prikazani su samo podaci radnog prostora koji je izabran."
        action={
          workspace.canEdit ? (
            <Link
              href={rehabUrl(locale, "/rehab/pacijenti/novi", { workspace: workspace.id })}
              className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark"
            >
              + {workspace.kind === "club" ? "Novi igrač" : "Novi pacijent"}
            </Link>
          ) : null
        }
      />
      <WorkspaceTabs
        access={access}
        selectedId={workspace.id}
        locale={locale}
        href="/rehab"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <RehabPanel key={stat.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="mt-1 text-3xl font-semibold text-navy">{stat.value}</p>
              </div>
              <div className="rounded-full bg-teal-50 p-3 text-teal-dark">
                <Icon className="h-6 w-6" />
              </div>
            </RehabPanel>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <RehabPanel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-navy">Naredni termini</h2>
            <Link
              href={rehabUrl(locale, "/rehab/termini", { workspace: workspace.id })}
              className="text-sm text-teal-dark hover:underline"
            >
              Svi termini
            </Link>
          </div>
          {(upcomingAppointments.data ?? []).length === 0 ? (
            <EmptyState>Nema zakazanih termina.</EmptyState>
          ) : (
            <div className="divide-y divide-gray-100">
              {((upcomingAppointments.data ?? []) as unknown as AppointmentRow[]).map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-teal-dark" />
                  <div className="min-w-0">
                    {item.patient ? (
                      <Link
                        href={rehabPatientUrl(locale, item.patient.id, { workspace: workspace.id })}
                        className="font-medium text-gray-800 hover:text-teal-dark hover:underline"
                      >
                        {item.patient.first_name} {item.patient.last_name}
                      </Link>
                    ) : (
                      <p className="font-medium text-gray-800">Obrisan zapis</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {formatRehabDate(item.starts_at, true)}
                      {item.therapy ? ` · ${item.therapy}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </RehabPanel>

        <RehabPanel>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold text-navy">Poslednji dnevni unosi</h2>
            <Link
              href={rehabUrl(locale, "/rehab/pacijenti", { workspace: workspace.id })}
              className="text-sm text-teal-dark hover:underline"
            >
              Svi kartoni
            </Link>
          </div>
          {(recentEntries.data ?? []).length === 0 ? (
            <EmptyState>Još nema dnevnih unosa.</EmptyState>
          ) : (
            <div className="divide-y divide-gray-100">
              {((recentEntries.data ?? []) as unknown as EntryRow[]).map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0">
                  <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-teal-dark" />
                  <div className="min-w-0">
                    {item.patient ? (
                      <Link
                        href={rehabPatientUrl(locale, item.patient.id, { workspace: workspace.id })}
                        className="font-medium text-gray-800 hover:text-teal-dark hover:underline"
                      >
                        {item.patient.first_name} {item.patient.last_name}
                      </Link>
                    ) : (
                      <p className="font-medium text-gray-800">Obrisan zapis</p>
                    )}
                    <p className="line-clamp-2 text-sm text-gray-500">
                      {formatRehabDate(item.recorded_on)} · {item.therapy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </RehabPanel>

        <RehabPanel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold text-navy">Potrebna pažnja</h2>
              <p className="mt-1 text-xs text-gray-400">Bez dnevnog unosa u poslednjih 7 dana</p>
            </div>
            <span className="rounded-full bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          {patientsNeedingAttention.length === 0 ? (
            <EmptyState>Svi aktivni kartoni su ažurni.</EmptyState>
          ) : (
            <div className="divide-y divide-gray-100">
              {patientsNeedingAttention.slice(0, 5).map((patient) => (
                <Link
                  key={patient.id}
                  href={rehabPatientUrl(locale, patient.id, { workspace: workspace.id })}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 hover:text-teal-dark"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-xs text-gray-400">U rehabilitaciji od {formatRehabDate(patient.started_on)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-amber-700">Otvori →</span>
                </Link>
              ))}
              {patientsNeedingAttention.length > 5 && (
                <Link
                  href={rehabUrl(locale, "/rehab/pacijenti", { workspace: workspace.id })}
                  className="block pt-3 text-sm font-medium text-teal-dark hover:underline"
                >
                  Prikaži sve ({patientsNeedingAttention.length})
                </Link>
              )}
            </div>
          )}
        </RehabPanel>
      </div>
    </div>
  );
}
