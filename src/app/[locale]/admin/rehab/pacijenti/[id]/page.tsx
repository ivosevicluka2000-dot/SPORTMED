import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, ClipboardList, Clock3, HeartPulse, Mail, Phone, ListChecks } from "lucide-react";
import {
  copyRehabPlanAction,
  createDailyEntryAction,
  createRehabPlanAction,
  removeDailyEntryImageAction,
  updateDailyEntryAction,
  updatePlanDayAction,
  updatePlanStatusAction,
  updateRehabPlanAction,
  updateRehabPatientAction,
} from "@/app/[locale]/admin/rehab/_actions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRehabAccessContext, selectRehabWorkspace } from "@/lib/rehab/access";
import { dateInputValue, formatRehabDate } from "@/lib/rehab/dates";
import type {
  RehabAppointment,
  RehabDailyEntry,
  RehabPatient,
  RehabPlan,
} from "@/lib/rehab/types";
import type { Locale } from "@/i18n/routing";
import {
  EmptyState,
  RehabAlert,
  RehabPainBadge,
  RehabPageHeader,
  RehabPanel,
  rehabInputClass,
  rehabLabelClass,
  rehabPatientReportUrl,
  rehabPlanPrintUrl,
  rehabUrl,
} from "@/components/rehab/RehabUi";
import { RehabForm } from "@/components/rehab/RehabForm";
import { RehabSubmitButton } from "@/components/rehab/RehabSubmitButton";
import { RehabCopyLastEntryButton } from "@/components/rehab/RehabCopyLastEntryButton";
import { RehabConfirmSubmitButton } from "@/components/rehab/RehabConfirmSubmitButton";

export const dynamic = "force-dynamic";

export default async function RehabPatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ workspace?: string; error?: string; saved?: string }>;
}) {
  const [{ locale: rawLocale, id }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;

  const supabase = await createClient();
  const [patientResult, entriesResult, plansResult, appointmentsResult, otherPatientsResult] = await Promise.all([
    supabase
      .from("rehab_patients")
      .select(
        "id, workspace_id, record_type, first_name, last_name, email, phone, birth_date, problem, started_on, status, completed_at, notes, created_at, updated_at"
      )
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("rehab_daily_entries")
      .select(
        "id, patient_id, workspace_id, recorded_on, condition_summary, pain_level, therapy, notes, image_paths, created_by, created_at",
        { count: "exact" }
      )
      .eq("patient_id", id)
      .eq("workspace_id", workspace.id)
      .order("recorded_on", { ascending: false })
      .limit(100),
    supabase
      .from("rehab_plans")
      .select(
        "id, patient_id, workspace_id, title, start_date, end_date, goal, notes, status, days:rehab_plan_days(id, plan_id, workspace_id, day_number, planned_date, instructions)"
      )
      .eq("patient_id", id)
      .eq("workspace_id", workspace.id)
      .order("start_date", { ascending: false }),
    supabase
      .from("rehab_appointments")
      .select(
        "id, patient_id, workspace_id, starts_at, duration_minutes, therapy, notes, status, reminder_email, reminder_hours_before, reminder_sent_at"
      )
      .eq("patient_id", id)
      .eq("workspace_id", workspace.id)
      .order("starts_at", { ascending: false })
      .limit(20),
    supabase
      .from("rehab_patients")
      .select("id, first_name, last_name")
      .eq("workspace_id", workspace.id)
      .eq("status", "active")
      .neq("id", id)
      .order("last_name", { ascending: true }),
  ]);

  if (!patientResult.data) notFound();
  const patient = patientResult.data as RehabPatient;
  const entries = (entriesResult.data ?? []) as RehabDailyEntry[];
  const plans = ((plansResult.data ?? []) as unknown as RehabPlan[]).map((plan) => ({
    ...plan,
    days: [...(plan.days ?? [])].sort((a, b) => a.day_number - b.day_number),
  }));
  const appointments = (appointmentsResult.data ?? []) as RehabAppointment[];
  const otherPatients = (otherPatientsResult.data ?? []) as Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
  const creatorIds = [...new Set(entries.map((entry) => entry.created_by).filter(Boolean))];
  const imagePaths = entries.flatMap((entry) => entry.image_paths ?? []);
  const admin = createAdminClient();
  const [creatorResult, signedImageResult] = await Promise.all([
    creatorIds.length > 0
      ? admin.from("profiles").select("id, full_name").in("id", creatorIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }> }),
    imagePaths.length > 0
      ? supabase.storage.from("rehab-entry-images").createSignedUrls(imagePaths, 60 * 60)
      : Promise.resolve({ data: [] as Array<{ path: string; signedUrl: string }> }),
  ]);
  const creatorNameById = new Map(
    (creatorResult.data ?? []).map((profile) => [profile.id, profile.full_name || "Član tima"])
  );
  const signedImageByPath = new Map(
    (signedImageResult.data ?? [])
      .filter((item) => item.signedUrl)
      .map((item) => [item.path, item.signedUrl])
  );
  const latestPainEntry = entries.find((entry) => entry.pain_level !== null);
  const activePlan = plans.find((plan) => plan.status === "active");
  const today = dateInputValue();
  const activeTodayDay = activePlan?.days?.find((day) => day.planned_date === today);
  const currentTime = new Date().getTime();
  const nextAppointment = appointments
    .filter(
      (appointment) =>
        appointment.status === "scheduled" &&
        new Date(appointment.starts_at).getTime() >= currentTime
    )
    .sort(
      (first, second) =>
        new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime()
    )[0];
  const timeline = [
    ...entries.map((entry) => ({
      id: `entry-${entry.id}`,
      date: entry.recorded_on,
      label: "Terapija",
      title: entry.therapy,
    })),
    ...appointments.map((appointment) => ({
      id: `appointment-${appointment.id}`,
      date: appointment.starts_at,
      label: "Termin",
      title: appointment.therapy || "Zakazan tretman",
    })),
    ...plans.map((plan) => ({
      id: `plan-${plan.id}`,
      date: plan.start_date,
      label: "Plan",
      title: plan.title,
    })),
  ]
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
    .slice(0, 12);

  return (
    <div>
      <RehabPageHeader
        eyebrow={`${workspace.name} · ${patient.record_type === "player" ? "Igrač" : "Pacijent"}`}
        title={`${patient.first_name} ${patient.last_name}`}
        description={patient.problem || "Problem ili povreda nisu uneti."}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={rehabPatientReportUrl(locale, patient.id, workspace.id)}
              className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark"
            >
              Štampaj izveštaj
            </Link>
            <Link
              href={rehabUrl(locale, "/rehab/pacijenti", { workspace: workspace.id })}
              className="rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              ← Nazad na kartone
            </Link>
          </div>
        }
      />
      <RehabAlert error={query.error} saved={query.saved} />

      <div className={`mb-6 grid gap-3 sm:grid-cols-2 ${workspace.role === "player" ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
        <RehabPanel className="flex items-center gap-3 p-4 md:p-4">
          <span className="rounded-full bg-teal-50 p-2.5 text-teal-dark">
            <HeartPulse className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-gray-400">Evidentirane terapije</p>
            <p className="text-lg font-semibold text-navy">{entriesResult.count ?? entries.length}</p>
          </div>
        </RehabPanel>
        <RehabPanel className="flex items-center gap-3 p-4 md:p-4">
          <span className="rounded-full bg-teal-50 p-2.5 text-teal-dark">
            <ListChecks className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-gray-400">Poslednji nivo bola</p>
            <div className="mt-1">
              {latestPainEntry?.pain_level !== null && latestPainEntry?.pain_level !== undefined ? (
                <RehabPainBadge value={latestPainEntry.pain_level} />
              ) : (
                <p className="text-sm font-medium text-gray-500">Nije unet</p>
              )}
            </div>
          </div>
        </RehabPanel>
        <RehabPanel className="flex min-w-0 items-center gap-3 p-4 md:p-4">
          <span className="rounded-full bg-teal-50 p-2.5 text-teal-dark">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Aktivni plan</p>
            <p className="truncate text-sm font-semibold text-navy">{activePlan?.title ?? "Nema aktivnog plana"}</p>
            {activeTodayDay && (
              <p className="mt-0.5 text-xs font-medium text-teal-dark">
                Danas je dan {activeTodayDay.day_number}/{activePlan?.days?.length ?? 0}
              </p>
            )}
          </div>
        </RehabPanel>
        {workspace.role !== "player" && (
          <RehabPanel className="flex min-w-0 items-center gap-3 p-4 md:p-4">
            <span className="rounded-full bg-teal-50 p-2.5 text-teal-dark">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Sledeći termin</p>
              <p className="truncate text-sm font-semibold text-navy">
                {nextAppointment ? formatRehabDate(nextAppointment.starts_at, true) : "Nema zakazanog termina"}
              </p>
            </div>
          </RehabPanel>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <RehabPanel>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-2xl font-semibold text-navy">Dnevna evidencija</h2>
              <span className="text-sm text-gray-500">{entries.length} unosa</span>
            </div>

            {workspace.canEdit && (
              <details className="mb-6 rounded-lg border border-teal/30 bg-teal-50/50 p-4">
                <summary className="cursor-pointer font-medium text-navy">+ Dodaj dnevni unos</summary>
                <RehabForm action={createDailyEntryAction} className="mt-4 space-y-4">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="workspace_id" value={workspace.id} />
                  <input type="hidden" name="patient_id" value={patient.id} />
                  {entries[0] && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal/20 bg-white p-3">
                      <p className="text-xs text-gray-500">Ista ili slična terapija kao prethodni put?</p>
                      <RehabCopyLastEntryButton
                        entry={{
                          conditionSummary: entries[0].condition_summary,
                          painLevel: entries[0].pain_level,
                          therapy: entries[0].therapy,
                          notes: entries[0].notes ?? "",
                        }}
                      />
                    </div>
                  )}
                  <div className="grid gap-4 sm:grid-cols-[180px_160px_1fr]">
                    <label>
                      <span className={rehabLabelClass}>Datum *</span>
                      <input name="recorded_on" type="date" required defaultValue={dateInputValue()} className={rehabInputClass} />
                    </label>
                    <label>
                      <span className={rehabLabelClass}>Bol 0–10</span>
                      <input name="pain_level" type="number" min={0} max={10} className={rehabInputClass} />
                    </label>
                    <label>
                      <span className={rehabLabelClass}>Trenutno stanje *</span>
                      <input name="condition_summary" required maxLength={1000} className={rehabInputClass} />
                    </label>
                  </div>
                  <label>
                    <span className={rehabLabelClass}>Urađena terapija *</span>
                    <textarea name="therapy" required rows={3} maxLength={3000} className={rehabInputClass} />
                  </label>
                  <label>
                    <span className={rehabLabelClass}>Napomena</span>
                    <textarea name="notes" rows={2} maxLength={3000} className={rehabInputClass} />
                  </label>
                  <label>
                    <span className={rehabLabelClass}>Fotografije</span>
                    <input
                      name="images"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className={`${rehabInputClass} file:mr-3 file:rounded file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-teal-dark`}
                    />
                    <span className="mt-1 block text-xs text-gray-500">Do 3 privatne slike po unosu, JPG, PNG ili WebP, do 5 MB po slici.</span>
                  </label>
                  <RehabSubmitButton className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                    Sačuvaj unos
                  </RehabSubmitButton>
                </RehabForm>
              </details>
            )}

            {entries.length === 0 ? (
              <EmptyState>Još nema dnevnih unosa.</EmptyState>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <article key={entry.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <time className="font-medium text-navy">{formatRehabDate(entry.recorded_on)}</time>
                      {entry.pain_level !== null && (
                        <RehabPainBadge value={entry.pain_level} />
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{entry.condition_summary}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{entry.therapy}</p>
                    {entry.notes && <p className="mt-2 text-sm italic text-gray-500">{entry.notes}</p>}
                    {(entry.image_paths ?? []).length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {entry.image_paths.map((path, imageIndex) => {
                          const signedUrl = signedImageByPath.get(path);
                          if (!signedUrl) return null;
                          return (
                            <div key={path} className="relative aspect-[4/3]">
                              <a
                                href={signedUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute inset-0 overflow-hidden rounded-lg border border-gray-200 bg-white"
                              >
                                <Image
                                  src={signedUrl}
                                  alt={`Fotografija uz terapiju ${imageIndex + 1}`}
                                  fill
                                  unoptimized
                                  className="object-cover transition hover:scale-[1.02]"
                                />
                              </a>
                              {workspace.canEdit && (
                                <form action={removeDailyEntryImageAction} className="absolute right-2 top-2 z-10">
                                  <input type="hidden" name="locale" value={locale} />
                                  <input type="hidden" name="workspace_id" value={workspace.id} />
                                  <input type="hidden" name="patient_id" value={patient.id} />
                                  <input type="hidden" name="entry_id" value={entry.id} />
                                  <input type="hidden" name="image_path" value={path} />
                                  <RehabConfirmSubmitButton
                                    confirmMessage="Da li sigurno želite da uklonite ovu fotografiju?"
                                    aria-label={`Ukloni fotografiju ${imageIndex + 1}`}
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm font-semibold text-white hover:bg-red-600"
                                  >
                                    ×
                                  </RehabConfirmSubmitButton>
                                </form>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="mt-3 text-xs text-gray-400">
                      Uneo: {creatorNameById.get(entry.created_by) ?? "Član tima"}
                    </p>
                    {workspace.canEdit && (
                      <details className="mt-3 border-t border-gray-200 pt-3">
                        <summary className="cursor-pointer text-xs font-medium text-teal-dark">
                          Izmeni dnevni unos
                        </summary>
                        <RehabForm action={updateDailyEntryAction} className="mt-4 space-y-3">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="workspace_id" value={workspace.id} />
                          <input type="hidden" name="patient_id" value={patient.id} />
                          <input type="hidden" name="entry_id" value={entry.id} />
                          <div className="grid gap-3 sm:grid-cols-[180px_140px_1fr]">
                            <label>
                              <span className={rehabLabelClass}>Datum *</span>
                              <input name="recorded_on" type="date" required defaultValue={entry.recorded_on} className={rehabInputClass} />
                            </label>
                            <label>
                              <span className={rehabLabelClass}>Bol 0–10</span>
                              <input name="pain_level" type="number" min={0} max={10} defaultValue={entry.pain_level ?? ""} className={rehabInputClass} />
                            </label>
                            <label>
                              <span className={rehabLabelClass}>Trenutno stanje *</span>
                              <input name="condition_summary" required maxLength={1000} defaultValue={entry.condition_summary} className={rehabInputClass} />
                            </label>
                          </div>
                          <label>
                            <span className={rehabLabelClass}>Urađena terapija *</span>
                            <textarea name="therapy" required rows={3} maxLength={3000} defaultValue={entry.therapy} className={rehabInputClass} />
                          </label>
                          <label>
                            <span className={rehabLabelClass}>Napomena</span>
                            <textarea name="notes" rows={2} maxLength={3000} defaultValue={entry.notes ?? ""} className={rehabInputClass} />
                          </label>
                          <label>
                            <span className={rehabLabelClass}>Dodaj fotografije</span>
                            <input
                              name="images"
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              multiple
                              className={`${rehabInputClass} file:mr-3 file:rounded file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-teal-dark`}
                            />
                            <span className="mt-1 block text-xs text-gray-500">
                              Trenutno: {(entry.image_paths ?? []).length}/3. Nove slike se dodaju postojećim.
                            </span>
                          </label>
                          <RehabSubmitButton className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                            Sačuvaj izmene
                          </RehabSubmitButton>
                        </RehabForm>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            )}
          </RehabPanel>

          <RehabPanel>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-2xl font-semibold text-navy">Rehabilitacioni planovi</h2>
              <span className="text-sm text-gray-500">{plans.length} planova</span>
            </div>

            {workspace.canEdit && (
              <details className="mb-6 rounded-lg border border-teal/30 bg-teal-50/50 p-4">
                <summary className="cursor-pointer font-medium text-navy">+ Napravi novi plan</summary>
                <RehabForm action={createRehabPlanAction} className="mt-4 space-y-4">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="workspace_id" value={workspace.id} />
                  <input type="hidden" name="patient_id" value={patient.id} />
                  <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
                    <label>
                      <span className={rehabLabelClass}>Naziv plana *</span>
                      <input name="title" required maxLength={200} placeholder="Npr. Rehabilitacija kolena" className={rehabInputClass} />
                    </label>
                    <label>
                      <span className={rehabLabelClass}>Početak *</span>
                      <input name="start_date" type="date" required defaultValue={dateInputValue()} className={rehabInputClass} />
                    </label>
                  </div>
                  <label>
                    <span className={rehabLabelClass}>Cilj plana</span>
                    <input name="goal" maxLength={1000} className={rehabInputClass} />
                  </label>
                  <label>
                    <span className={rehabLabelClass}>Plan po danima *</span>
                    <textarea
                      name="instructions"
                      required
                      rows={10}
                      className={rehabInputClass}
                      placeholder={"Jedan red predstavlja jedan dan.\nMobilnost i led 15 min\nVežbe aktivacije 3×10\n..."}
                    />
                    <span className="mt-1 block text-xs text-gray-500">Jedan neprazan red = jedan dan plana. Najviše 60 dana po planu.</span>
                  </label>
                  <label>
                    <span className={rehabLabelClass}>Napomena</span>
                    <textarea name="notes" rows={2} maxLength={3000} className={rehabInputClass} />
                  </label>
                  <RehabSubmitButton className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                    Sačuvaj plan
                  </RehabSubmitButton>
                </RehabForm>
              </details>
            )}

            {plans.length === 0 ? (
              <EmptyState>Još nema rehabilitacionih planova.</EmptyState>
            ) : (
              <div className="space-y-5">
                {plans.map((plan) => (
                  <article key={plan.id} className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="flex flex-wrap items-start justify-between gap-3 bg-gray-50 px-4 py-4">
                      <div>
                        <h3 className="font-semibold text-navy">{plan.title}</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatRehabDate(plan.start_date)} – {formatRehabDate(plan.end_date)} · {plan.days?.length ?? 0} dana
                        </p>
                        {plan.goal && <p className="mt-2 text-sm text-gray-600">Cilj: {plan.goal}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={rehabPlanPrintUrl(locale, patient.id, plan.id, workspace.id)}
                          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-navy"
                        >
                          Štampaj plan
                        </Link>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${plan.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                          {plan.status === "active" ? "Aktivan" : "Završen"}
                        </span>
                        {workspace.canEdit && (
                          <form action={updatePlanStatusAction}>
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="workspace_id" value={workspace.id} />
                            <input type="hidden" name="patient_id" value={patient.id} />
                            <input type="hidden" name="plan_id" value={plan.id} />
                            <input type="hidden" name="status" value={plan.status === "active" ? "completed" : "active"} />
                            <button className="text-xs text-teal-dark hover:underline">
                              {plan.status === "active" ? "Označi završenim" : "Vrati u aktivne"}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                    {workspace.canEdit && (
                      <details className="border-t border-gray-100 bg-white px-4 py-3">
                        <summary className="cursor-pointer text-xs font-medium text-teal-dark">
                          Izmeni osnovne podatke plana
                        </summary>
                        <RehabForm action={updateRehabPlanAction} className="mt-4 space-y-3">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="workspace_id" value={workspace.id} />
                          <input type="hidden" name="patient_id" value={patient.id} />
                          <input type="hidden" name="plan_id" value={plan.id} />
                          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                            <label>
                              <span className={rehabLabelClass}>Naziv plana *</span>
                              <input name="title" required maxLength={200} defaultValue={plan.title} className={rehabInputClass} />
                            </label>
                            <label>
                              <span className={rehabLabelClass}>Početak *</span>
                              <input name="start_date" type="date" required defaultValue={plan.start_date} className={rehabInputClass} />
                            </label>
                          </div>
                          <label>
                            <span className={rehabLabelClass}>Cilj plana</span>
                            <input name="goal" maxLength={1000} defaultValue={plan.goal ?? ""} className={rehabInputClass} />
                          </label>
                          <label>
                            <span className={rehabLabelClass}>Napomena</span>
                            <textarea name="notes" rows={2} maxLength={3000} defaultValue={plan.notes ?? ""} className={rehabInputClass} />
                          </label>
                          <RehabSubmitButton className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                            Sačuvaj podatke plana
                          </RehabSubmitButton>
                        </RehabForm>
                      </details>
                    )}
                    {workspace.canEdit && otherPatients.length > 0 && (
                      <details className="border-t border-gray-100 bg-white px-4 py-3">
                        <summary className="cursor-pointer text-xs font-medium text-teal-dark">
                          Kopiraj ceo plan u drugi karton
                        </summary>
                        <RehabForm action={copyRehabPlanAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="workspace_id" value={workspace.id} />
                          <input type="hidden" name="patient_id" value={patient.id} />
                          <input type="hidden" name="plan_id" value={plan.id} />
                          <label>
                            <span className={rehabLabelClass}>Kopiraj za</span>
                            <select name="target_patient_id" required className={rehabInputClass}>
                              {otherPatients.map((otherPatient) => (
                                <option key={otherPatient.id} value={otherPatient.id}>
                                  {otherPatient.first_name} {otherPatient.last_name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span className={rehabLabelClass}>Novi datum početka</span>
                            <input name="start_date" type="date" required defaultValue={today} className={rehabInputClass} />
                          </label>
                          <RehabSubmitButton className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                            Kopiraj plan
                          </RehabSubmitButton>
                        </RehabForm>
                      </details>
                    )}
                    <div className="divide-y divide-gray-100">
                      {(plan.days ?? []).map((day) => (
                        <div
                          key={day.id}
                          className={`grid gap-2 px-4 py-3 sm:grid-cols-[100px_1fr] ${day.planned_date === today ? "border-l-4 border-teal bg-teal-50/70" : ""}`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-navy">
                              Dan {day.day_number}
                              {day.planned_date === today && (
                                <span className="ml-2 rounded-full bg-teal px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">Danas</span>
                              )}
                            </p>
                            {day.planned_date && <p className="text-xs text-gray-400">{formatRehabDate(day.planned_date)}</p>}
                          </div>
                          <div>
                            <p className="whitespace-pre-wrap text-sm text-gray-700">{day.instructions}</p>
                            {workspace.canEdit && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs font-medium text-teal-dark">Izmeni dan</summary>
                                <RehabForm action={updatePlanDayAction} className="mt-3 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                                  <input type="hidden" name="locale" value={locale} />
                                  <input type="hidden" name="workspace_id" value={workspace.id} />
                                  <input type="hidden" name="patient_id" value={patient.id} />
                                  <input type="hidden" name="day_id" value={day.id} />
                                  <label>
                                    <span className="sr-only">Planirani datum</span>
                                    <input name="planned_date" type="date" required defaultValue={day.planned_date ?? ""} className={rehabInputClass} />
                                  </label>
                                  <input name="instructions" defaultValue={day.instructions} required className={rehabInputClass} />
                                  <RehabSubmitButton
                                    pendingLabel="Čuvanje..."
                                    className="rounded-md border border-gray-200 px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50"
                                  >
                                    Sačuvaj
                                  </RehabSubmitButton>
                                </RehabForm>
                              </details>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {plan.notes && <p className="border-t border-gray-100 px-4 py-3 text-sm italic text-gray-500">{plan.notes}</p>}
                  </article>
                ))}
              </div>
            )}
          </RehabPanel>

          <RehabPanel>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-heading text-2xl font-semibold text-navy">Tok rehabilitacije</h2>
              <Clock3 className="h-5 w-5 text-teal-dark" />
            </div>
            {timeline.length === 0 ? (
              <EmptyState>Aktivnosti će se ovde pojaviti čim napravite prvi unos.</EmptyState>
            ) : (
              <ol className="relative ml-2 border-l border-gray-200">
                {timeline.map((item) => (
                  <li key={item.id} className="relative mb-5 ml-5 last:mb-0">
                    <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal" />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-teal-dark">{item.label}</span>
                      <time className="text-xs text-gray-400">{formatRehabDate(item.date, item.label === "Termin")}</time>
                    </div>
                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-gray-700">{item.title}</p>
                  </li>
                ))}
              </ol>
            )}
          </RehabPanel>
        </div>

        <aside className="order-first space-y-6 xl:order-last">
          <RehabPanel>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-heading text-xl font-semibold text-navy">Podaci</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${patient.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                {patient.status === "active" ? "Aktivan" : "Završen"}
              </span>
            </div>
            {(patient.phone || patient.email) && (
              <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {patient.phone && (
                  <a href={`tel:${patient.phone}`} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-navy hover:bg-gray-50">
                    <Phone className="h-4 w-4 text-teal-dark" /> Pozovi
                  </a>
                )}
                {patient.email && (
                  <a href={`mailto:${patient.email}`} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-navy hover:bg-gray-50">
                    <Mail className="h-4 w-4 text-teal-dark" /> Pošalji email
                  </a>
                )}
              </div>
            )}
            {workspace.canEdit ? (
              <RehabForm action={updateRehabPatientAction} className="space-y-3">
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="workspace_id" value={workspace.id} />
                <input type="hidden" name="patient_id" value={patient.id} />
                <label><span className={rehabLabelClass}>Ime *</span><input name="first_name" required defaultValue={patient.first_name} className={rehabInputClass} /></label>
                <label><span className={rehabLabelClass}>Prezime *</span><input name="last_name" required defaultValue={patient.last_name} className={rehabInputClass} /></label>
                <label><span className={rehabLabelClass}>Email</span><input name="email" type="email" defaultValue={patient.email ?? ""} className={rehabInputClass} /></label>
                <label><span className={rehabLabelClass}>Telefon</span><input name="phone" defaultValue={patient.phone ?? ""} className={rehabInputClass} /></label>
                <label><span className={rehabLabelClass}>Datum rođenja</span><input name="birth_date" type="date" defaultValue={patient.birth_date ?? ""} className={rehabInputClass} /></label>
                <label><span className={rehabLabelClass}>Početak</span><input name="started_on" type="date" required defaultValue={patient.started_on} className={rehabInputClass} /></label>
                <label><span className={rehabLabelClass}>Problem / povreda</span><textarea name="problem" rows={3} defaultValue={patient.problem ?? ""} className={rehabInputClass} /></label>
                <label><span className={rehabLabelClass}>Napomena</span><textarea name="notes" rows={3} defaultValue={patient.notes ?? ""} className={rehabInputClass} /></label>
                <label>
                  <span className={rehabLabelClass}>Status</span>
                  <select name="status" defaultValue={patient.status} className={rehabInputClass}>
                    <option value="active">Aktivan</option>
                    <option value="completed">Završen</option>
                  </select>
                </label>
                <RehabSubmitButton className="w-full rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                  Sačuvaj izmene
                </RehabSubmitButton>
              </RehabForm>
            ) : (
              <dl className="space-y-3 text-sm">
                <div><dt className="text-gray-400">Email</dt><dd className="text-gray-700">{patient.email || "—"}</dd></div>
                <div><dt className="text-gray-400">Telefon</dt><dd className="text-gray-700">{patient.phone || "—"}</dd></div>
                <div><dt className="text-gray-400">Početak</dt><dd className="text-gray-700">{formatRehabDate(patient.started_on)}</dd></div>
                <div><dt className="text-gray-400">Napomena</dt><dd className="whitespace-pre-wrap text-gray-700">{patient.notes || "—"}</dd></div>
              </dl>
            )}
          </RehabPanel>

          {workspace.role !== "player" && (
            <RehabPanel>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold text-navy">Termini</h2>
                <Link href={rehabUrl(locale, "/rehab/termini", { workspace: workspace.id })} className="text-xs text-teal-dark hover:underline">Otvori termine</Link>
              </div>
              {appointments.length === 0 ? (
                <p className="text-sm text-gray-500">Nema termina.</p>
              ) : (
                <div className="space-y-3">
                  {appointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="rounded-lg bg-gray-50 p-3 text-sm">
                      <p className="font-medium text-navy">{formatRehabDate(appointment.starts_at, true)}</p>
                      <p className="text-gray-500">{appointment.therapy || "Terapija nije navedena"}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {appointment.status === "scheduled" ? "Zakazan" : appointment.status === "completed" ? "Završen" : "Otkazan"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </RehabPanel>
          )}
        </aside>
      </div>
    </div>
  );
}
