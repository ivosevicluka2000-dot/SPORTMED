"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, adminClient } from "@/lib/admin-helpers";
import { getPathname, type Locale } from "@/i18n/routing";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function bool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}
function dateOrNull(v: FormDataEntryValue | null): string | null {
  const t = s(v);
  if (!t) return null;
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function upsertDiscountAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData.get("id")) || null;
  const code = s(formData.get("code")).toUpperCase();
  const locale = (s(formData.get("locale")) || "sr") as Locale;
  if (!code) throw new Error("Code required");

  const payload = {
    code,
    type: s(formData.get("type")) === "fixed" ? "fixed" : "percent",
    value: Math.round(num(formData.get("value"))),
    valid_from: dateOrNull(formData.get("valid_from")),
    valid_until: dateOrNull(formData.get("valid_until")),
    max_uses: formData.get("max_uses")
      ? Math.round(num(formData.get("max_uses")))
      : null,
    min_order_amount: formData.get("min_order_amount")
      ? Math.round(num(formData.get("min_order_amount")))
      : null,
    active: bool(formData.get("active")),
  };

  const admin = adminClient();
  if (id) {
    const { error } = await admin
      .from("discount_codes")
      .update(payload)
      .eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("discount_codes").insert(payload);
    if (error) throw error;
  }
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/discounts" }));
}

export async function deleteDiscountAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData.get("id"));
  const locale = (s(formData.get("locale")) || "sr") as Locale;
  if (!id) return;
  const admin = adminClient();
  await admin.from("discount_codes").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/discounts" }));
}
