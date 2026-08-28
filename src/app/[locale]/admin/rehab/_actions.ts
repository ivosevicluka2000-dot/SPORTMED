"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPathname, type Locale } from "@/i18n/routing";
import { localBelgradeDateTimeToIso } from "@/lib/rehab/dates";
import { requireRehabWorkspace } from "@/lib/rehab/access";
import { requireAdmin } from "@/lib/admin-helpers";

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string): string | null {
  return value || null;
}

function localeFrom(formData: FormData): Locale {
  return text(formData.get("locale")) === "en" ? "en" : "sr";
}

function pathWithQuery(
  locale: Locale,
  href:
    | "/rehab"
    | "/rehab/pacijenti"
    | "/rehab/pacijenti/novi"
    | "/rehab/termini"
    | "/rehab/izvestaji"
    | "/rehab/tim",
  query: Record<string, string | undefined>
) {
  const pathname = getPathname({ locale, href });
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const suffix = params.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}

function patientPath(
  locale: Locale,
  patientId: string,
  query: Record<string, string | undefined> = {}
) {
  const pathname = getPathname({
    locale,
    href: { pathname: "/rehab/pacijenti/[id]", params: { id: patientId } },
  });
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const suffix = params.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}

const patientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.union([z.literal(""), z.email()]),
  phone: z.string().max(50),
  birthDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
  problem: z.string().max(3000),
  startedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(5000),
});

export async function createRehabPatientAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  const parsed = patientSchema.safeParse({
    firstName: text(formData.get("first_name")),
    lastName: text(formData.get("last_name")),
    email: text(formData.get("email")),
    phone: text(formData.get("phone")),
    birthDate: text(formData.get("birth_date")),
    problem: text(formData.get("problem")),
    startedOn: text(formData.get("started_on")),
    notes: text(formData.get("notes")),
  });

  if (!parsed.success) {
    redirect(
      pathWithQuery(locale, "/rehab/pacijenti/novi", {
        workspace: workspaceId,
        error: "Proverite obavezna polja i email adresu.",
      })
    );
  }

  const value = parsed.data;
  const { data, error } = await access.supabase
    .from("rehab_patients")
    .insert({
      workspace_id: workspaceId,
      record_type: access.workspace.kind === "club" ? "player" : "patient",
      first_name: value.firstName,
      last_name: value.lastName,
      email: optional(value.email),
      phone: optional(value.phone),
      birth_date: optional(value.birthDate),
      problem: optional(value.problem),
      started_on: value.startedOn,
      notes: optional(value.notes),
      created_by: access.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      pathWithQuery(locale, "/rehab/pacijenti/novi", {
        workspace: workspaceId,
        error: "Pacijent nije sačuvan. Pokušajte ponovo.",
      })
    );
  }

  revalidatePath(getPathname({ locale, href: "/rehab" }));
  redirect(patientPath(locale, data.id, { workspace: workspaceId, saved: "1" }));
}

export async function updateRehabPatientAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const patientId = text(formData.get("patient_id"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  const parsed = patientSchema.safeParse({
    firstName: text(formData.get("first_name")),
    lastName: text(formData.get("last_name")),
    email: text(formData.get("email")),
    phone: text(formData.get("phone")),
    birthDate: text(formData.get("birth_date")),
    problem: text(formData.get("problem")),
    startedOn: text(formData.get("started_on")),
    notes: text(formData.get("notes")),
  });

  if (!parsed.success) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Proverite podatke." }));
  }

  const value = parsed.data;
  const status = text(formData.get("status")) === "completed" ? "completed" : "active";
  const { data: currentPatient, error: patientError } = await access.supabase
    .from("rehab_patients")
    .select("status, completed_at")
    .eq("id", patientId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (patientError || !currentPatient) {
    redirect(patientPath(locale, patientId, {
      workspace: workspaceId,
      error: "Karton nije pronađen.",
    }));
  }

  const completedAt = status === "completed"
    ? currentPatient.status === "completed" && currentPatient.completed_at
      ? currentPatient.completed_at
      : new Date().toISOString()
    : null;
  const { error } = await access.supabase
    .from("rehab_patients")
    .update({
      first_name: value.firstName,
      last_name: value.lastName,
      email: optional(value.email),
      phone: optional(value.phone),
      birth_date: optional(value.birthDate),
      problem: optional(value.problem),
      started_on: value.startedOn,
      notes: optional(value.notes),
      status,
      completed_at: completedAt,
    })
    .eq("id", patientId)
    .eq("workspace_id", workspaceId);

  redirect(
    patientPath(locale, patientId, {
      workspace: workspaceId,
      ...(error ? { error: "Izmene nisu sačuvane." } : { saved: "1" }),
    })
  );
}

export async function createDailyEntryAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const patientId = text(formData.get("patient_id"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  const painText = text(formData.get("pain_level"));
  const painLevel = painText === "" ? null : Number(painText);
  const recordedOn = text(formData.get("recorded_on"));
  const condition = text(formData.get("condition_summary"));
  const therapy = text(formData.get("therapy"));

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(recordedOn) ||
    !condition ||
    !therapy ||
    (painLevel !== null && (!Number.isInteger(painLevel) || painLevel < 0 || painLevel > 10))
  ) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Dnevni unos nije ispravan." }));
  }

  const { error } = await access.supabase.from("rehab_daily_entries").insert({
    workspace_id: workspaceId,
    patient_id: patientId,
    recorded_on: recordedOn,
    condition_summary: condition,
    pain_level: painLevel,
    therapy,
    notes: optional(text(formData.get("notes"))),
    created_by: access.userId,
  });

  redirect(
    patientPath(locale, patientId, {
      workspace: workspaceId,
      ...(error ? { error: "Dnevni unos nije sačuvan." } : { saved: "entry" }),
    })
  );
}

export async function createRehabPlanAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const patientId = text(formData.get("patient_id"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  const title = text(formData.get("title"));
  const startDate = text(formData.get("start_date"));
  const instructions = text(formData.get("instructions"))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 60);

  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || instructions.length === 0) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Unesite naziv, datum i najmanje jedan dan plana." }));
  }

  const end = new Date(`${startDate}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + instructions.length - 1);
  const endDate = end.toISOString().slice(0, 10);
  const { data: plan, error: planError } = await access.supabase
    .from("rehab_plans")
    .insert({
      workspace_id: workspaceId,
      patient_id: patientId,
      title,
      start_date: startDate,
      end_date: endDate,
      goal: optional(text(formData.get("goal"))),
      notes: optional(text(formData.get("notes"))),
      created_by: access.userId,
    })
    .select("id")
    .single();

  if (planError || !plan) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Plan nije sačuvan." }));
  }

  const days = instructions.map((line, index) => {
    const planned = new Date(`${startDate}T12:00:00Z`);
    planned.setUTCDate(planned.getUTCDate() + index);
    return {
      workspace_id: workspaceId,
      plan_id: plan.id,
      day_number: index + 1,
      planned_date: planned.toISOString().slice(0, 10),
      instructions: line,
      created_by: access.userId,
    };
  });
  const { error: daysError } = await access.supabase.from("rehab_plan_days").insert(days);
  if (daysError) {
    await access.supabase.from("rehab_plans").delete().eq("id", plan.id);
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Dani plana nisu sačuvani." }));
  }

  redirect(patientPath(locale, patientId, { workspace: workspaceId, saved: "plan" }));
}

export async function updatePlanDayAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const patientId = text(formData.get("patient_id"));
  const dayId = text(formData.get("day_id"));
  const instructions = text(formData.get("instructions"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  if (!instructions) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Opis dana ne može biti prazan." }));
  }
  const { error } = await access.supabase
    .from("rehab_plan_days")
    .update({ instructions })
    .eq("id", dayId)
    .eq("workspace_id", workspaceId);
  redirect(patientPath(locale, patientId, { workspace: workspaceId, ...(error ? { error: "Dan plana nije izmenjen." } : { saved: "day" }) }));
}

export async function updatePlanStatusAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const patientId = text(formData.get("patient_id"));
  const planId = text(formData.get("plan_id"));
  const status = text(formData.get("status")) === "completed" ? "completed" : "active";
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  const { error } = await access.supabase
    .from("rehab_plans")
    .update({ status })
    .eq("id", planId)
    .eq("workspace_id", workspaceId);
  redirect(patientPath(locale, patientId, { workspace: workspaceId, ...(error ? { error: "Status plana nije promenjen." } : { saved: "plan-status" }) }));
}

export async function createAppointmentAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const patientId = text(formData.get("patient_id"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  let startsAt: string;
  try {
    startsAt = localBelgradeDateTimeToIso(text(formData.get("starts_at")));
  } catch {
    redirect(pathWithQuery(locale, "/rehab/termini", { workspace: workspaceId, error: "Termin nije ispravno unet." }));
  }

  const duration = Number(text(formData.get("duration_minutes")) || "60");
  if (!Number.isInteger(duration) || duration < 15 || duration > 240) {
    redirect(pathWithQuery(locale, "/rehab/termini", { workspace: workspaceId, error: "Trajanje termina nije ispravno." }));
  }

  const { data: patient } = await access.supabase
    .from("rehab_patients")
    .select("email")
    .eq("id", patientId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!patient) {
    redirect(pathWithQuery(locale, "/rehab/termini", { workspace: workspaceId, error: "Pacijent ili igrač nije pronađen." }));
  }

  const reminderEmail = text(formData.get("reminder_email")) || patient.email || "";
  if (reminderEmail && !z.email().safeParse(reminderEmail).success) {
    redirect(pathWithQuery(locale, "/rehab/termini", { workspace: workspaceId, error: "Email za podsetnik nije ispravan." }));
  }

  const { error } = await access.supabase.from("rehab_appointments").insert({
    workspace_id: workspaceId,
    patient_id: patientId,
    starts_at: startsAt,
    duration_minutes: duration,
    therapy: optional(text(formData.get("therapy"))),
    notes: optional(text(formData.get("notes"))),
    reminder_email: optional(reminderEmail),
    reminder_hours_before: 24,
    created_by: access.userId,
  });

  redirect(pathWithQuery(locale, "/rehab/termini", { workspace: workspaceId, ...(error ? { error: "Termin nije sačuvan." } : { saved: "1" }) }));
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const appointmentId = text(formData.get("appointment_id"));
  const rawStatus = text(formData.get("status"));
  const status = rawStatus === "completed" || rawStatus === "cancelled" ? rawStatus : "scheduled";
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  const { error } = await access.supabase
    .from("rehab_appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("workspace_id", workspaceId);
  redirect(pathWithQuery(locale, "/rehab/termini", { workspace: workspaceId, ...(error ? { error: "Status termina nije promenjen." } : { saved: "status" }) }));
}

export async function savePeriodSummaryAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const periodType = text(formData.get("period_type")) === "year" ? "year" : "month";
  const period = text(formData.get("period"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  const valid = periodType === "year"
    ? /^\d{4}$/.test(period)
    : /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
  if (!valid) {
    redirect(pathWithQuery(locale, "/rehab/izvestaji", { workspace: workspaceId, error: "Period nije ispravan." }));
  }
  const periodStart = periodType === "year" ? `${period}-01-01` : `${period}-01`;
  const { error } = await access.supabase.from("rehab_period_summaries").upsert(
    {
      workspace_id: workspaceId,
      period_type: periodType,
      period_start: periodStart,
      conclusion: text(formData.get("conclusion")),
      created_by: access.userId,
    },
    { onConflict: "workspace_id,period_type,period_start" }
  );
  redirect(pathWithQuery(locale, "/rehab/izvestaji", { workspace: workspaceId, type: periodType, period, ...(error ? { error: "Zaključak nije sačuvan." } : { saved: "1" }) }));
}

export async function addWorkspaceMemberAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const email = text(formData.get("email")).toLowerCase();
  const fullName = text(formData.get("full_name"));
  const password = text(formData.get("password"));
  await requireAdmin();
  const access = await requireRehabWorkspace(locale, workspaceId, "manage");
  const parsed = z
    .object({
      email: z.email(),
      fullName: z.string().min(2).max(100),
      password: z.string().min(8).max(72),
    })
    .safeParse({ email, fullName, password });
  if (!parsed.success) {
    redirect(pathWithQuery(locale, "/rehab/tim", {
      workspace: workspaceId,
      error: "Unesite ime, ispravan email i privremenu lozinku od najmanje 8 karaktera.",
    }));
  }

  const admin = createAdminClient();
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) {
    redirect(pathWithQuery(locale, "/rehab/tim", { workspace: workspaceId, error: "Nalog nije moguće kreirati." }));
  }
  let target = listed.users.find((user) => user.email?.toLowerCase() === email);
  let createdUserId: string | null = null;
  if (!target) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError || !created.user) {
      redirect(pathWithQuery(locale, "/rehab/tim", {
        workspace: workspaceId,
        error: "Nalog nije kreiran. Proverite email i pokušajte ponovo.",
      }));
    }
    target = created.user;
    createdUserId = created.user.id;
  }

  const { data: otherMembership } = await admin
    .from("rehab_workspace_members")
    .select("workspace_id")
    .eq("user_id", target.id)
    .neq("workspace_id", workspaceId)
    .limit(1)
    .maybeSingle();

  if (otherMembership) {
    if (createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId);
    }
    redirect(pathWithQuery(locale, "/rehab/tim", {
      workspace: workspaceId,
      error: "Ovaj nalog već pripada drugom prostoru. Nalog može imati pristup samo klinici ili samo klubu.",
    }));
  }

  const requestedRole = text(formData.get("role"));
  const role = access.workspace.kind === "club"
    ? "viewer"
    : requestedRole === "viewer"
      ? "viewer"
      : "therapist";
  const { error } = await admin.from("rehab_workspace_members").upsert(
    {
      workspace_id: workspaceId,
      user_id: target.id,
      role,
      created_by: access.userId,
    },
    { onConflict: "workspace_id,user_id" }
  );

  if (error && createdUserId) {
    await admin.auth.admin.deleteUser(createdUserId);
  }

  if (!error && !createdUserId) {
    const [{ error: profileError }, { error: passwordError }] = await Promise.all([
      admin
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", target.id),
      admin.auth.admin.updateUserById(target.id, {
        password,
        user_metadata: { ...target.user_metadata, full_name: fullName },
      }),
    ]);
    if (profileError || passwordError) {
      redirect(pathWithQuery(locale, "/rehab/tim", {
        workspace: workspaceId,
        error: "Pristup je sačuvan, ali ime ili privremena lozinka nisu ažurirani. Pokušajte ponovo.",
      }));
    }
  }

  redirect(pathWithQuery(locale, "/rehab/tim", {
    workspace: workspaceId,
    ...(error
      ? { error: "Nalog i pristup nisu sačuvani." }
      : { saved: createdUserId ? "created" : "assigned" }),
  }));
}

export async function removeWorkspaceMemberAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const userId = text(formData.get("user_id"));
  await requireAdmin();
  await requireRehabWorkspace(locale, workspaceId, "manage");
  const admin = createAdminClient();
  const { error } = await admin
    .from("rehab_workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
  redirect(pathWithQuery(locale, "/rehab/tim", { workspace: workspaceId, ...(error ? { error: "Pristup nije uklonjen." } : { saved: "removed" }) }));
}
