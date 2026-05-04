"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, adminClient } from "@/lib/admin-helpers";
import { getPathname, type Locale } from "@/i18n/routing";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

const STATUSES = new Set(["new", "contacted", "closed"]);

export async function updateLeadAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData.get("id"));
  const status = s(formData.get("status"));
  const notes = s(formData.get("notes"));
  const locale = (s(formData.get("locale")) || "sr") as Locale;
  if (!id) return;
  const update: Record<string, unknown> = {};
  if (STATUSES.has(status)) update.status = status;
  if (formData.has("notes")) update.notes = notes || null;
  if (Object.keys(update).length === 0) return;
  const admin = adminClient();
  await admin.from("leads").update(update).eq("id", id);
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/leads" }));
}
