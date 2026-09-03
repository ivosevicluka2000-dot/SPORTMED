import Link from "next/link";
import { CalendarClock, Mail } from "lucide-react";
import {
  createAppointmentAction,
  updateAppointmentAction,
  updateAppointmentStatusAction,
} from "@/app/[locale]/admin/rehab/_actions";
import { createClient } from "@/lib/supabase/server";
import { getRehabAccessContext, selectRehabWorkspace } from "@/lib/rehab/access";
import {
  dateInputValue,
  dateTimeLocalInputValue,
  formatRehabDate,
  localBelgradeDateTimeToIso,
} from "@/lib/rehab/dates";
import type { RehabAppointment, RehabPatient } from "@/lib/rehab/types";
import type { Locale } from "@/i18n/routing";
import {
  EmptyState,
  RehabAlert,
  RehabPageHeader,
  RehabPanel,
  WorkspaceTabs,
  rehabInputClass,
  rehabLabelClass,
  rehabUrl,
} from "@/components/rehab/RehabUi";
import { RehabForm } from "@/components/rehab/RehabForm";
import { RehabSubmitButton } from "@/components/rehab/RehabSubmitButton";

export const dynamic = "force-dynamic";

export default async function RehabAppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ workspace?: string; error?: string; saved?: string; period?: string }>;
}) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;

  const supabase = await createClient();
  const currentDate = new Date();
  const period = query.period === "today" || query.period === "week" ? query.period : "all";
  const since = new Date(currentDate);
  since.setDate(since.getDate() - 30);
  const todayKey = dateInputValue(currentDate);
  const tomorrow = new Date(`${todayKey}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const weekEnd = new Date(`${todayKey}T12:00:00Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  let appointmentsQuery = supabase
    .from("rehab_appointments")
    .select(
      "id, patient_id, workspace_id, starts_at, duration_minutes, therapy, notes, status, reminder_email, reminder_hours_before, reminder_sent_at, patient:rehab_patients(id, first_name, last_name, email)"
    )
    .eq("workspace_id", workspace.id)
    .order("starts_at", { ascending: true })
    .limit(300);
  if (period === "today") {
    appointmentsQuery = appointmentsQuery
      .gte("starts_at", localBelgradeDateTimeToIso(`${todayKey}T00:00`))
      .lt("starts_at", localBelgradeDateTimeToIso(`${dateInputValue(tomorrow)}T00:00`));
  } else if (period === "week") {
    appointmentsQuery = appointmentsQuery
      .gte("starts_at", localBelgradeDateTimeToIso(`${todayKey}T00:00`))
      .lt("starts_at", localBelgradeDateTimeToIso(`${dateInputValue(weekEnd)}T00:00`));
  } else {
    appointmentsQuery = appointmentsQuery.gte("starts_at", since.toISOString());
  }
  const [{ data: patients }, { data: appointments }] = await Promise.all([
    supabase
      .from("rehab_patients")
      .select("id, first_name, last_name, email, status")
      .eq("workspace_id", workspace.id)
      .eq("status", "active")
      .order("last_name", { ascending: true }),
    appointmentsQuery,
  ]);

  const patientRows = (patients ?? []) as Array<
    Pick<RehabPatient, "id" | "first_name" | "last_name" | "email" | "status">
  >;
  const rows = (appointments ?? []) as unknown as RehabAppointment[];
  const now = currentDate.getTime();
  const upcoming = rows.filter((row) => new Date(row.starts_at).getTime() >= now && row.status === "scheduled");
  const recent = rows.filter((row) => !upcoming.includes(row)).reverse();
  const suggested = new Date(currentDate.getTime() + 60 * 60 * 1000);
  suggested.setMinutes(Math.ceil(suggested.getMinutes() / 15) * 15, 0, 0);

  return (
    <div>
      <RehabPageHeader
        eyebrow={workspace.name}
        title="Termini"
        description="Zakazivanje i automatski email podsetnik 24 sata pre termina. Vreme se prikazuje po vremenskoj zoni Beograda."
      />
      <WorkspaceTabs
        access={access}
        selectedId={workspace.id}
        locale={locale}
        href="/rehab/termini"
      />
      <RehabAlert error={query.error} saved={query.saved} />

      <div className="mb-6 inline-flex rounded-lg border border-gray-200 bg-white p-1">
        {([
          ["all", "Svi"],
          ["today", "Danas"],
          ["week", "Narednih 7 dana"],
        ] as const).map(([value, label]) => (
          <Link
            key={value}
            href={rehabUrl(locale, "/rehab/termini", {
              workspace: workspace.id,
              period: value === "all" ? undefined : value,
            })}
            aria-current={period === value ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${period === value ? "bg-navy text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {workspace.canEdit && (
        <RehabPanel className="mb-6">
          <h2 className="mb-5 font-heading text-2xl font-semibold text-navy">Novi termin</h2>
          {patientRows.length === 0 ? (
            <EmptyState>Prvo dodajte aktivnog pacijenta ili igrača.</EmptyState>
          ) : (
            <RehabForm action={createAppointmentAction} className="space-y-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="workspace_id" value={workspace.id} />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label>
                  <span className={rehabLabelClass}>{workspace.kind === "club" ? "Igrač" : "Pacijent"} *</span>
                  <select name="patient_id" required className={rehabInputClass}>
                    {patientRows.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.last_name} {patient.first_name}
                        {patient.email ? ` · ${patient.email}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={rehabLabelClass}>Datum i vreme *</span>
                  <input
                    name="starts_at"
                    type="datetime-local"
                    required
                    defaultValue={dateTimeLocalInputValue(suggested)}
                    className={rehabInputClass}
                  />
                </label>
                <label>
                  <span className={rehabLabelClass}>Trajanje</span>
                  <select name="duration_minutes" defaultValue="60" className={rehabInputClass}>
                    <option value="30">30 minuta</option>
                    <option value="45">45 minuta</option>
                    <option value="60">60 minuta</option>
                    <option value="90">90 minuta</option>
                  </select>
                </label>
                <label>
                  <span className={rehabLabelClass}>Email za podsetnik</span>
                  <input
                    name="reminder_email"
                    type="email"
                    placeholder="Koristi email iz kartona"
                    className={rehabInputClass}
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className={rehabLabelClass}>Terapija / razlog dolaska</span>
                  <input name="therapy" maxLength={1000} className={rehabInputClass} />
                </label>
                <label>
                  <span className={rehabLabelClass}>Interna napomena</span>
                  <input name="notes" maxLength={2000} className={rehabInputClass} />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <RehabSubmitButton className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                  Zakaži termin
                </RehabSubmitButton>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail className="h-3.5 w-3.5" />
                  Ako karton nema email, termin se čuva bez podsetnika.
                </span>
              </div>
            </RehabForm>
          )}
        </RehabPanel>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <AppointmentList
          title="Naredni termini"
          rows={upcoming}
          locale={locale}
          workspaceId={workspace.id}
          canEdit={workspace.canEdit}
          empty="Nema narednih termina."
        />
        <AppointmentList
          title="Prethodni i zatvoreni"
          rows={recent.slice(0, 50)}
          locale={locale}
          workspaceId={workspace.id}
          canEdit={workspace.canEdit}
          empty={period === "all" ? "Nema prethodnih termina u poslednjih 30 dana." : "Nema prethodnih ni zatvorenih termina u izabranom periodu."}
        />
      </div>
    </div>
  );
}

function AppointmentList({
  title,
  rows,
  locale,
  workspaceId,
  canEdit,
  empty,
}: {
  title: string;
  rows: RehabAppointment[];
  locale: Locale;
  workspaceId: string;
  canEdit: boolean;
  empty: string;
}) {
  return (
    <RehabPanel>
      <h2 className="mb-5 font-heading text-2xl font-semibold text-navy">{title}</h2>
      {rows.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <div className="space-y-3">
          {rows.map((appointment) => (
            <article key={appointment.id} className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-teal-dark" />
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">
                      {appointment.patient
                        ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                        : "Obrisan karton"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatRehabDate(appointment.starts_at, true)} · {appointment.duration_minutes} min
                    </p>
                    {appointment.therapy && <p className="mt-1 text-sm text-gray-500">{appointment.therapy}</p>}
                    {appointment.notes && <p className="mt-1 text-xs italic text-gray-400">{appointment.notes}</p>}
                    <p className="mt-2 text-xs text-gray-400">
                      {appointment.reminder_email
                        ? appointment.reminder_sent_at
                          ? `Podsetnik poslat ${formatRehabDate(appointment.reminder_sent_at, true)}`
                          : `Podsetnik: ${appointment.reminder_email}`
                        : "Bez email podsetnika"}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  appointment.status === "scheduled"
                    ? "bg-sky-100 text-sky-700"
                    : appointment.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-200 text-gray-600"
                }`}>
                  {appointment.status === "scheduled" ? "Zakazan" : appointment.status === "completed" ? "Završen" : "Otkazan"}
                </span>
              </div>
              {canEdit && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <form action={updateAppointmentStatusAction} className="flex flex-wrap gap-3">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="workspace_id" value={workspaceId} />
                    <input type="hidden" name="appointment_id" value={appointment.id} />
                    {appointment.status !== "completed" && (
                      <button name="status" value="completed" className="text-xs font-medium text-emerald-700 hover:underline">Označi završenim</button>
                    )}
                    {appointment.status !== "cancelled" && (
                      <button name="status" value="cancelled" className="text-xs font-medium text-red-600 hover:underline">Otkaži</button>
                    )}
                    {appointment.status !== "scheduled" && (
                      <button name="status" value="scheduled" className="text-xs font-medium text-sky-700 hover:underline">Vrati u zakazane</button>
                    )}
                  </form>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-teal-dark">Izmeni termin</summary>
                    <RehabForm action={updateAppointmentAction} className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="workspace_id" value={workspaceId} />
                      <input type="hidden" name="appointment_id" value={appointment.id} />
                      <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
                        <label>
                          <span className={rehabLabelClass}>Datum i vreme *</span>
                          <input
                            name="starts_at"
                            type="datetime-local"
                            required
                            defaultValue={dateTimeLocalInputValue(new Date(appointment.starts_at))}
                            className={rehabInputClass}
                          />
                        </label>
                        <label>
                          <span className={rehabLabelClass}>Trajanje</span>
                          <input
                            name="duration_minutes"
                            type="number"
                            min={15}
                            max={240}
                            step={15}
                            required
                            defaultValue={appointment.duration_minutes}
                            className={rehabInputClass}
                          />
                        </label>
                      </div>
                      <label>
                        <span className={rehabLabelClass}>Email za podsetnik</span>
                        <input name="reminder_email" type="email" defaultValue={appointment.reminder_email ?? ""} className={rehabInputClass} />
                      </label>
                      <label>
                        <span className={rehabLabelClass}>Terapija / razlog dolaska</span>
                        <input name="therapy" maxLength={1000} defaultValue={appointment.therapy ?? ""} className={rehabInputClass} />
                      </label>
                      <label>
                        <span className={rehabLabelClass}>Interna napomena</span>
                        <input name="notes" maxLength={2000} defaultValue={appointment.notes ?? ""} className={rehabInputClass} />
                      </label>
                      <RehabSubmitButton className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                        Sačuvaj izmene
                      </RehabSubmitButton>
                    </RehabForm>
                  </details>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </RehabPanel>
  );
}
