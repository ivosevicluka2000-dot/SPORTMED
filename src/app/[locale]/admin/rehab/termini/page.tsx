import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, Mail } from "lucide-react";
import {
  createAppointmentAction,
  deleteAppointmentAction,
  updateAppointmentAction,
  updateAppointmentStatusAction,
} from "@/app/[locale]/admin/rehab/_actions";
import { createClient } from "@/lib/supabase/server";
import { getRehabAccessContext, selectRehabWorkspace } from "@/lib/rehab/access";
import {
  dateInputValue,
  isValidRehabDate,
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
  rehabPatientUrl,
  rehabUrl,
} from "@/components/rehab/RehabUi";
import { RehabForm } from "@/components/rehab/RehabForm";
import { RehabSubmitButton } from "@/components/rehab/RehabSubmitButton";

import { RehabAppointmentCalendar } from "@/components/rehab/RehabAppointmentCalendar";
import { RehabConfirmSubmitButton } from "@/components/rehab/RehabConfirmSubmitButton";
import { rehabAppointmentDay, rehabCalendarMonth, rehabMonthBounds } from "@/lib/rehab/calendar";

export const dynamic = "force-dynamic";

export default async function RehabAppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ workspace?: string; error?: string; saved?: string; email?: string; period?: string; month?: string; day?: string }>;
}) {
  const t = await getTranslations("rehab");
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;
  if (workspace.role === "player" && workspace.patientId) {
    redirect(rehabPatientUrl(locale, workspace.patientId, { workspace: workspace.id }));
  }

  const supabase = await createClient();
  const currentDate = new Date();
  const period = ["today", "week", "all"].includes(query.period ?? "") ? query.period! : "month";
  const since = new Date(currentDate);
  since.setDate(since.getDate() - 30);
  const todayKey = dateInputValue(currentDate);
  const month = rehabCalendarMonth(query.month, todayKey);
  const selectedDay = query.day && isValidRehabDate(query.day) && query.day.startsWith(`${month}-`) ? query.day : undefined;
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
    .order("id", { ascending: true });
  if (period === "month") {
    const bounds = rehabMonthBounds(month);
    appointmentsQuery = appointmentsQuery.gte("starts_at", bounds.start).lt("starts_at", bounds.end);
  } else if (period === "today") {
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
  const [{ data: patients }, { data: appointments, error: appointmentsError }] = await Promise.all([
    supabase
      .from("rehab_patients")
      .select("id, first_name, last_name, email, status")
      .eq("workspace_id", workspace.id)
      .eq("status", "active")
      .order("last_name", { ascending: true }),
    (async () => {
      const data: RehabAppointment[] = [];
      for (let offset = 0; ; offset += 500) {
        const result = await appointmentsQuery.range(offset, offset + 499);
        if (result.error) return { data: [], error: result.error };
        data.push(...(result.data as unknown as RehabAppointment[]));
        if (result.data.length < 500) return { data, error: null };
      }
    })(),
  ]);

  const patientRows = (patients ?? []) as Array<
    Pick<RehabPatient, "id" | "first_name" | "last_name" | "email" | "status">
  >;
  const calendarRows = appointments;
  const rows = period === "month" && selectedDay ? calendarRows.filter(row => rehabAppointmentDay(row.starts_at) === selectedDay) : calendarRows;
  const emailStates = new Map<string, { status: string; event: string }>();
  let emailStatusError = false;
  if (workspace.canEdit && rows.length) {
    for (let offset = 0; offset < rows.length; offset += 100) {
      const { data, error } = await supabase.from("rehab_appointment_emails")
        .select("appointment_id, status, event")
        .eq("workspace_id", workspace.id)
        .in("appointment_id", rows.slice(offset, offset + 100).map(row => row.id))
        .neq("status", "skipped")
        .order("created_at", { ascending: false }).limit(1000);
      if (error) emailStatusError = true;
      for (const email of data ?? []) {
        if (!emailStates.has(email.appointment_id)) emailStates.set(email.appointment_id, email);
      }
    }
  }
  const now = currentDate.getTime();
  const upcoming = rows.filter((row) => new Date(row.starts_at).getTime() >= now && row.status === "scheduled");
  const recent = rows.filter((row) => !upcoming.includes(row)).reverse();
  const suggested = new Date(currentDate.getTime() + 60 * 60 * 1000);
  suggested.setMinutes(Math.ceil(suggested.getMinutes() / 15) * 15, 0, 0);
  const suggestedStart = selectedDay ? `${selectedDay}T09:00` : month === todayKey.slice(0, 7) ? dateTimeLocalInputValue(suggested) : `${month}-01T09:00`;

  return (
    <div>
      <RehabPageHeader
        eyebrow={workspace.name}
        title={t("labelAppointments")}
        description={t("labelSchedulingAndAutomaticEmailRemindersHoursBefore")}
      />
      <WorkspaceTabs
        access={access}
        selectedId={workspace.id}
        locale={locale}
        href="/rehab/termini"
      />
      <RehabAlert error={query.error || (appointmentsError ? t("calendarLoadError") : undefined)} saved={query.saved} />
      {(query.email === "pending" || emailStatusError) && <div role="status" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t(emailStatusError ? "appointmentEmailUnavailable" : "appointmentEmailQueued")}</div>}

      <div className="mb-6 inline-flex max-w-full flex-wrap rounded-lg border border-gray-200 bg-white p-1">
        {([
          ["month", t("calendarTitle")],
          ["all", t("labelAll")],
          ["today", t("labelToday")],
          ["week", t("labelNextDays")],
        ] as const).map(([value, label]) => (
          <Link
            key={value}
            href={rehabUrl(locale, "/rehab/termini", {
              workspace: workspace.id,
              period: value === "month" ? undefined : value,
            })}
            aria-current={period === value ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${period === value ? "bg-navy text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {period === "month" && !appointmentsError && <RehabAppointmentCalendar month={month} today={todayKey} selectedDay={selectedDay} rows={calendarRows} locale={locale} workspaceId={workspace.id} />}
      {period === "month" && selectedDay && <h2 className="mb-5 text-xl font-semibold text-navy">{formatRehabDate(`${selectedDay}T12:00:00Z`, false, locale)} · {t("calendarCount", { count: rows.length })}</h2>}

      {workspace.canEdit && (
        <RehabPanel className="mb-6">
          <h2 className="mb-5 font-heading text-2xl font-semibold text-navy">{t("labelNewAppointment")}</h2>
          {patientRows.length === 0 ? (
            <EmptyState>{t("labelAddAnActivePatientOrPlayerFirst")}</EmptyState>
          ) : (
            <RehabForm key={`${month}-${selectedDay ?? ""}`} action={createAppointmentAction} className="space-y-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="workspace_id" value={workspace.id} />
              <input type="hidden" name="month" value={month} />
              <input type="hidden" name="day" value={selectedDay ?? ""} />
              <input type="hidden" name="period" value={period} />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label>
                  <span className={rehabLabelClass}>{workspace.kind === "club" ? t("labelPlayer") : t("labelPatient")} *</span>
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
                  <span className={rehabLabelClass}>{t("labelDateAndTime")}</span>
                  <input
                    name="starts_at"
                    type="datetime-local"
                    required
                    defaultValue={suggestedStart}
                    className={rehabInputClass}
                  />
                </label>
                <label>
                  <span className={rehabLabelClass}>{t("labelDuration")}</span>
                  <select name="duration_minutes" defaultValue="60" className={rehabInputClass}>
                    <option value="30">{t("labelMinutes")}</option>
                    <option value="45">{t("labelMinutesui246")}</option>
                    <option value="60">{t("labelMinutesui247")}</option>
                    <option value="90">{t("labelMinutesui248")}</option>
                  </select>
                </label>
                <p className="self-center text-sm text-gray-500">{t("appointmentEmailFromRecord")}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className={rehabLabelClass}>{t("labelTherapyReasonForVisit")}</span>
                  <input name="therapy" maxLength={1000} className={rehabInputClass} />
                </label>
                <label>
                  <span className={rehabLabelClass}>{t("labelInternalNotes")}</span>
                  <input name="notes" maxLength={2000} className={rehabInputClass} />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <RehabSubmitButton className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                   {t("labelScheduleAppointment")} </RehabSubmitButton>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail className="h-3.5 w-3.5" />
                   {t("labelIfTheRecordHasNoEmailThe")} </span>
              </div>
            </RehabForm>
          )}
        </RehabPanel>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <AppointmentList
          title={t("labelUpcomingAppointments")}
          rows={upcoming}
          locale={locale}
          workspaceId={workspace.id}
          canEdit={workspace.canEdit}
          emailStates={emailStates}
          view={{ month, day: selectedDay, period }}
          empty={t("calendarNoAppointments")}
        />
        <AppointmentList
          title={t("labelPastAndClosed")}
          rows={recent}
          locale={locale}
          workspaceId={workspace.id}
          canEdit={workspace.canEdit}
          emailStates={emailStates}
          view={{ month, day: selectedDay, period }}
          empty={period === "all" ? t("labelNoPastAppointmentsInTheLastDays") : t("labelNoPastOrClosedAppointmentsInThe")}
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
  emailStates,
  empty,
  view,
}: {
  title: string;
  rows: RehabAppointment[];
  locale: Locale;
  workspaceId: string;
  canEdit: boolean;
  emailStates: Map<string, { status: string; event: string }>;
  empty: string;
  view: { month: string; day?: string; period: string };
}) {
  const t = useTranslations("rehab");
  return (
    <RehabPanel>
      <h2 className="mb-5 font-heading text-2xl font-semibold text-navy">{title}</h2>
      {rows.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <div className="space-y-3">
          {rows.map((appointment) => (
            <article id={`appointment-${appointment.id}`} key={appointment.id} className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-teal-dark" />
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">
                      {appointment.patient
                        ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                        : t("labelDeletedRecord")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatRehabDate(appointment.starts_at, true, locale)} · {appointment.duration_minutes} min
                    </p>
                    {appointment.therapy && <p className="mt-1 text-sm text-gray-500">{appointment.therapy}</p>}
                    {appointment.notes && <p className="mt-1 text-xs italic text-gray-400">{appointment.notes}</p>}
                    <p className="mt-2 text-xs text-gray-500">
                      {appointment.patient?.email
                        ? t("labelReminder", { v0: appointment.patient.email })
                        : t("labelNoEmailReminder")}
                    </p>
                    {appointment.patient?.email && emailStates.has(appointment.id) && <p className="mt-1 text-xs text-gray-500">
                      {emailStates.get(appointment.id)?.status === "sent" ? t("appointmentEmailSent")
                        : emailStates.get(appointment.id)?.status === "failed" ? t("appointmentEmailFailed")
                        : t("appointmentEmailPending")}
                    </p>}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  appointment.status === "scheduled"
                    ? "bg-sky-100 text-sky-700"
                    : appointment.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-200 text-gray-600"
                }`}>
                  {appointment.status === "scheduled" ? t("labelScheduled") : appointment.status === "completed" ? t("labelCompleted") : t("labelCancelled")}
                </span>
              </div>
              {canEdit && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <form action={updateAppointmentStatusAction} className="flex flex-wrap gap-3">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="workspace_id" value={workspaceId} />
                    <input type="hidden" name="appointment_id" value={appointment.id} />
                    {Object.entries(view).map(([name, value]) => <input key={name} type="hidden" name={name} value={value ?? ""} />)}
                    {appointment.status !== "completed" && (
                      <button name="status" value="completed" className="text-xs font-medium text-emerald-700 hover:underline">{t("labelMarkAsCompleted")}</button>
                    )}
                    {appointment.status !== "cancelled" && (
                      <button name="status" value="cancelled" className="text-xs font-medium text-red-600 hover:underline">{t("labelCancel")}</button>
                    )}
                    {appointment.status !== "scheduled" && (
                      <button name="status" value="scheduled" className="text-xs font-medium text-sky-700 hover:underline">{t("labelMarkAsScheduled")}</button>
                    )}
                  </form>
                  <form action={deleteAppointmentAction} className="mt-3">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="workspace_id" value={workspaceId} />
                    <input type="hidden" name="appointment_id" value={appointment.id} />
                    {Object.entries(view).map(([name, value]) => <input key={name} type="hidden" name={name} value={value ?? ""} />)}
                    <RehabConfirmSubmitButton confirmMessage={t("deleteAppointmentConfirm", { v0: `${appointment.patient?.first_name ?? ""} ${appointment.patient?.last_name ?? ""} · ${formatRehabDate(appointment.starts_at, true, locale)}` })} className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50">{t("deleteAppointment")}</RehabConfirmSubmitButton>
                  </form>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-teal-dark">{t("labelEditAppointment")}</summary>
                    <RehabForm action={updateAppointmentAction} className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="workspace_id" value={workspaceId} />
                      <input type="hidden" name="appointment_id" value={appointment.id} />
                    {Object.entries(view).map(([name, value]) => <input key={name} type="hidden" name={name} value={value ?? ""} />)}
                      <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
                        <label>
                          <span className={rehabLabelClass}>{t("labelDateAndTime")}</span>
                          <input
                            name="starts_at"
                            type="datetime-local"
                            required
                            defaultValue={dateTimeLocalInputValue(new Date(appointment.starts_at))}
                            className={rehabInputClass}
                          />
                        </label>
                        <label>
                          <span className={rehabLabelClass}>{t("labelDuration")}</span>
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
                      <p className="text-sm text-gray-500">{t("appointmentEmailFromRecord")}</p>
                      <label>
                        <span className={rehabLabelClass}>{t("labelTherapyReasonForVisit")}</span>
                        <input name="therapy" maxLength={1000} defaultValue={appointment.therapy ?? ""} className={rehabInputClass} />
                      </label>
                      <label>
                        <span className={rehabLabelClass}>{t("labelInternalNotes")}</span>
                        <input name="notes" maxLength={2000} defaultValue={appointment.notes ?? ""} className={rehabInputClass} />
                      </label>
                      <RehabSubmitButton className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                         {t("labelSaveChanges")} </RehabSubmitButton>
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
