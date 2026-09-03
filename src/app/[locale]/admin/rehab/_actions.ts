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

const REHAB_IMAGE_BUCKET = "rehab-entry-images";
const MAX_ENTRY_IMAGES = 3;
const MAX_ENTRY_IMAGE_BYTES = 5 * 1024 * 1024;
const ENTRY_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type RehabSupabaseClient = Awaited<
  ReturnType<typeof requireRehabWorkspace>
>["supabase"];

function rehabImageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((value): value is File => typeof value !== "string" && value.size > 0);
}

function validateRehabImages(files: File[], existingCount = 0): string | null {
  if (existingCount + files.length > MAX_ENTRY_IMAGES) {
    return `Možete dodati najviše ${MAX_ENTRY_IMAGES} slike po dnevnom unosu.`;
  }
  for (const file of files) {
    if (!ENTRY_IMAGE_EXTENSIONS[file.type]) {
      return "Dozvoljene su JPG, PNG i WebP slike.";
    }
    if (file.size > MAX_ENTRY_IMAGE_BYTES) {
      return "Jedna slika može imati najviše 5 MB.";
    }
  }
  return null;
}

async function uploadRehabImages(
  supabase: RehabSupabaseClient,
  workspaceId: string,
  patientId: string,
  entryId: string,
  files: File[]
) {
  const uploadedPaths: string[] = [];
  for (const file of files) {
    const extension = ENTRY_IMAGE_EXTENSIONS[file.type];
    const path = `${workspaceId}/${patientId}/${entryId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(REHAB_IMAGE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(REHAB_IMAGE_BUCKET).remove(uploadedPaths);
      }
      return { paths: [] as string[], error };
    }
    uploadedPaths.push(path);
  }
  return { paths: uploadedPaths, error: null };
}

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
  const notes = text(formData.get("notes"));
  const images = rehabImageFiles(formData);
  const imageError = validateRehabImages(images);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(recordedOn) ||
    !condition ||
    condition.length > 1000 ||
    !therapy ||
    therapy.length > 3000 ||
    notes.length > 3000 ||
    imageError ||
    (painLevel !== null && (!Number.isInteger(painLevel) || painLevel < 0 || painLevel > 10))
  ) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: imageError ?? "Dnevni unos nije ispravan." }));
  }

  const { data: entry, error } = await access.supabase
    .from("rehab_daily_entries")
    .insert({
      workspace_id: workspaceId,
      patient_id: patientId,
      recorded_on: recordedOn,
      condition_summary: condition,
      pain_level: painLevel,
      therapy,
      notes: optional(notes),
      created_by: access.userId,
    })
    .select("id")
    .single();

  if (error || !entry) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Dnevni unos nije sačuvan." }));
  }

  if (images.length > 0) {
    const upload = await uploadRehabImages(
      access.supabase,
      workspaceId,
      patientId,
      entry.id,
      images
    );
    if (upload.error) {
      await access.supabase.from("rehab_daily_entries").delete().eq("id", entry.id);
      redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Slike nisu sačuvane. Proverite format i pokušajte ponovo." }));
    }
    const { error: imageSaveError } = await access.supabase
      .from("rehab_daily_entries")
      .update({ image_paths: upload.paths })
      .eq("id", entry.id)
      .eq("workspace_id", workspaceId);
    if (imageSaveError) {
      await access.supabase.storage.from(REHAB_IMAGE_BUCKET).remove(upload.paths);
      await access.supabase.from("rehab_daily_entries").delete().eq("id", entry.id);
      redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Slike nisu povezane sa dnevnim unosom." }));
    }
  }

  redirect(
    patientPath(locale, patientId, {
      workspace: workspaceId,
      saved: "entry",
    })
  );
}

export async function updateDailyEntryAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const patientId = text(formData.get("patient_id"));
  const entryId = text(formData.get("entry_id"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  const painText = text(formData.get("pain_level"));
  const painLevel = painText === "" ? null : Number(painText);
  const recordedOn = text(formData.get("recorded_on"));
  const condition = text(formData.get("condition_summary"));
  const therapy = text(formData.get("therapy"));
  const notes = text(formData.get("notes"));
  const images = rehabImageFiles(formData);

  if (
    !entryId ||
    !/^\d{4}-\d{2}-\d{2}$/.test(recordedOn) ||
    !condition ||
    condition.length > 1000 ||
    !therapy ||
    therapy.length > 3000 ||
    notes.length > 3000 ||
    (painLevel !== null && (!Number.isInteger(painLevel) || painLevel < 0 || painLevel > 10))
  ) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Izmene dnevnog unosa nisu ispravne." }));
  }

  const { data: currentEntry, error: currentEntryError } = await access.supabase
    .from("rehab_daily_entries")
    .select("image_paths")
    .eq("id", entryId)
    .eq("patient_id", patientId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (currentEntryError || !currentEntry) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Dnevni unos nije pronađen." }));
  }
  const currentImagePaths = (currentEntry.image_paths ?? []) as string[];
  const imageError = validateRehabImages(images, currentImagePaths.length);
  if (imageError) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: imageError }));
  }

  const upload = await uploadRehabImages(
    access.supabase,
    workspaceId,
    patientId,
    entryId,
    images
  );
  if (upload.error) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Nove slike nisu sačuvane." }));
  }

  const { error } = await access.supabase
    .from("rehab_daily_entries")
    .update({
      recorded_on: recordedOn,
      condition_summary: condition,
      pain_level: painLevel,
      therapy,
      notes: optional(notes),
      image_paths: [...currentImagePaths, ...upload.paths],
    })
    .eq("id", entryId)
    .eq("patient_id", patientId)
    .eq("workspace_id", workspaceId);

  if (error && upload.paths.length > 0) {
    await access.supabase.storage.from(REHAB_IMAGE_BUCKET).remove(upload.paths);
  }

  redirect(patientPath(locale, patientId, {
    workspace: workspaceId,
    ...(error ? { error: "Dnevni unos nije izmenjen." } : { saved: "entry-updated" }),
  }));
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

export async function copyRehabPlanAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const sourcePatientId = text(formData.get("patient_id"));
  const sourcePlanId = text(formData.get("plan_id"));
  const targetPatientId = text(formData.get("target_patient_id"));
  const startDate = text(formData.get("start_date"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");

  if (
    !sourcePlanId ||
    !targetPatientId ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate)
  ) {
    redirect(patientPath(locale, sourcePatientId, { workspace: workspaceId, error: "Podaci za kopiranje plana nisu ispravni." }));
  }

  const [{ data: targetPatient }, { data: sourcePlan }, { data: sourceDays }] =
    await Promise.all([
      access.supabase
        .from("rehab_patients")
        .select("id")
        .eq("id", targetPatientId)
        .eq("workspace_id", workspaceId)
        .maybeSingle(),
      access.supabase
        .from("rehab_plans")
        .select("title, goal, notes")
        .eq("id", sourcePlanId)
        .eq("patient_id", sourcePatientId)
        .eq("workspace_id", workspaceId)
        .maybeSingle(),
      access.supabase
        .from("rehab_plan_days")
        .select("day_number, instructions")
        .eq("plan_id", sourcePlanId)
        .eq("workspace_id", workspaceId)
        .order("day_number", { ascending: true }),
    ]);

  if (!targetPatient || !sourcePlan || !sourceDays?.length) {
    redirect(patientPath(locale, sourcePatientId, { workspace: workspaceId, error: "Plan ili ciljni karton nisu pronađeni." }));
  }

  const end = new Date(`${startDate}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + sourceDays.length - 1);
  const { data: copiedPlan, error: planError } = await access.supabase
    .from("rehab_plans")
    .insert({
      workspace_id: workspaceId,
      patient_id: targetPatientId,
      title: sourcePlan.title,
      start_date: startDate,
      end_date: end.toISOString().slice(0, 10),
      goal: sourcePlan.goal,
      notes: sourcePlan.notes,
      status: "active",
      created_by: access.userId,
    })
    .select("id")
    .single();

  if (planError || !copiedPlan) {
    redirect(patientPath(locale, sourcePatientId, { workspace: workspaceId, error: "Plan nije kopiran." }));
  }

  const copiedDays = sourceDays.map((day, index) => {
    const planned = new Date(`${startDate}T12:00:00Z`);
    planned.setUTCDate(planned.getUTCDate() + index);
    return {
      workspace_id: workspaceId,
      plan_id: copiedPlan.id,
      day_number: index + 1,
      planned_date: planned.toISOString().slice(0, 10),
      instructions: day.instructions,
      created_by: access.userId,
    };
  });
  const { error: daysError } = await access.supabase
    .from("rehab_plan_days")
    .insert(copiedDays);

  if (daysError) {
    await access.supabase.from("rehab_plans").delete().eq("id", copiedPlan.id);
    redirect(patientPath(locale, sourcePatientId, { workspace: workspaceId, error: "Dani kopiranog plana nisu sačuvani." }));
  }

  redirect(patientPath(locale, targetPatientId, { workspace: workspaceId, saved: "plan-copied" }));
}

export async function removeDailyEntryImageAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const patientId = text(formData.get("patient_id"));
  const entryId = text(formData.get("entry_id"));
  const imagePath = text(formData.get("image_path"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  const expectedPrefix = `${workspaceId}/${patientId}/${entryId}/`;

  if (!entryId || !imagePath.startsWith(expectedPrefix)) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Slika nije ispravno izabrana." }));
  }

  const { data: entry, error: entryError } = await access.supabase
    .from("rehab_daily_entries")
    .select("image_paths")
    .eq("id", entryId)
    .eq("patient_id", patientId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  const imagePaths = (entry?.image_paths ?? []) as string[];
  if (entryError || !entry || !imagePaths.includes(imagePath)) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Slika nije pronađena u dnevnom unosu." }));
  }

  const { error: updateError } = await access.supabase
    .from("rehab_daily_entries")
    .update({ image_paths: imagePaths.filter((path) => path !== imagePath) })
    .eq("id", entryId)
    .eq("patient_id", patientId)
    .eq("workspace_id", workspaceId);
  if (updateError) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Slika nije uklonjena iz dnevnog unosa." }));
  }

  await access.supabase.storage.from(REHAB_IMAGE_BUCKET).remove([imagePath]);
  redirect(patientPath(locale, patientId, { workspace: workspaceId, saved: "image-removed" }));
}

export async function updateRehabPlanAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const patientId = text(formData.get("patient_id"));
  const planId = text(formData.get("plan_id"));
  const title = text(formData.get("title"));
  const startDate = text(formData.get("start_date"));
  const goal = text(formData.get("goal"));
  const notes = text(formData.get("notes"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");

  if (
    !planId ||
    !title ||
    title.length > 200 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    goal.length > 1000 ||
    notes.length > 3000
  ) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Podaci plana nisu ispravni." }));
  }

  const { data: days, error: daysReadError } = await access.supabase
    .from("rehab_plan_days")
    .select("id, day_number")
    .eq("plan_id", planId)
    .eq("workspace_id", workspaceId)
    .order("day_number", { ascending: true });

  if (daysReadError || !days?.length) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Dani plana nisu pronađeni." }));
  }

  const end = new Date(`${startDate}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + days.length - 1);
  const { error: planError } = await access.supabase
    .from("rehab_plans")
    .update({
      title,
      start_date: startDate,
      end_date: end.toISOString().slice(0, 10),
      goal: optional(goal),
      notes: optional(notes),
    })
    .eq("id", planId)
    .eq("patient_id", patientId)
    .eq("workspace_id", workspaceId);

  if (planError) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Plan nije izmenjen." }));
  }

  const dayUpdates = await Promise.all(
    days.map((day) => {
      const planned = new Date(`${startDate}T12:00:00Z`);
      planned.setUTCDate(planned.getUTCDate() + day.day_number - 1);
      return access.supabase
        .from("rehab_plan_days")
        .update({ planned_date: planned.toISOString().slice(0, 10) })
        .eq("id", day.id)
        .eq("workspace_id", workspaceId);
    })
  );
  const dayError = dayUpdates.some((result) => result.error);

  redirect(patientPath(locale, patientId, {
    workspace: workspaceId,
    ...(dayError ? { error: "Plan je izmenjen, ali datumi pojedinih dana nisu sačuvani." } : { saved: "plan-updated" }),
  }));
}

export async function updatePlanDayAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const patientId = text(formData.get("patient_id"));
  const dayId = text(formData.get("day_id"));
  const instructions = text(formData.get("instructions"));
  const plannedDate = text(formData.get("planned_date"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  if (
    !instructions ||
    instructions.length > 3000 ||
    (plannedDate && !/^\d{4}-\d{2}-\d{2}$/.test(plannedDate))
  ) {
    redirect(patientPath(locale, patientId, { workspace: workspaceId, error: "Datum i opis dana nisu ispravni." }));
  }
  const { error } = await access.supabase
    .from("rehab_plan_days")
    .update({ instructions, planned_date: optional(plannedDate) })
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

export async function updateAppointmentAction(formData: FormData) {
  const locale = localeFrom(formData);
  const workspaceId = text(formData.get("workspace_id"));
  const appointmentId = text(formData.get("appointment_id"));
  const access = await requireRehabWorkspace(locale, workspaceId, "edit");
  let startsAt: string;
  try {
    startsAt = localBelgradeDateTimeToIso(text(formData.get("starts_at")));
  } catch {
    redirect(pathWithQuery(locale, "/rehab/termini", { workspace: workspaceId, error: "Datum i vreme termina nisu ispravni." }));
  }

  const duration = Number(text(formData.get("duration_minutes")) || "60");
  const reminderEmail = text(formData.get("reminder_email"));
  const therapy = text(formData.get("therapy"));
  const notes = text(formData.get("notes"));
  if (
    !appointmentId ||
    !Number.isInteger(duration) ||
    duration < 15 ||
    duration > 240 ||
    (reminderEmail && !z.email().safeParse(reminderEmail).success) ||
    therapy.length > 1000 ||
    notes.length > 2000
  ) {
    redirect(pathWithQuery(locale, "/rehab/termini", { workspace: workspaceId, error: "Izmene termina nisu ispravne." }));
  }

  const { error } = await access.supabase
    .from("rehab_appointments")
    .update({
      starts_at: startsAt,
      duration_minutes: duration,
      therapy: optional(therapy),
      notes: optional(notes),
      reminder_email: optional(reminderEmail),
      reminder_sent_at: null,
    })
    .eq("id", appointmentId)
    .eq("workspace_id", workspaceId);

  redirect(pathWithQuery(locale, "/rehab/termini", {
    workspace: workspaceId,
    ...(error ? { error: "Termin nije izmenjen." } : { saved: "appointment-updated" }),
  }));
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
