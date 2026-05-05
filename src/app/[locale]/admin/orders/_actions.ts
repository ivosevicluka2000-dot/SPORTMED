"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, adminClient } from "@/lib/admin-helpers";
import { getPathname, type Locale } from "@/i18n/routing";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

const COD_STATUSES = new Set(["pending", "processing", "paid", "cancelled"]);

const CARD_STATUSES = new Set([
  "pending",
  "awaiting_payment",
  "confirmed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
]);

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData.get("id"));
  const status = s(formData.get("status"));
  const locale = (s(formData.get("locale")) || "sr") as Locale;
  if (!id || !status) return;
  const admin = adminClient();
  const { data: existing } = await admin
    .from("orders")
    .select("payment_method")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return;
  const allowed =
    (existing.payment_method as string) === "cod" ? COD_STATUSES : CARD_STATUSES;
  if (!allowed.has(status)) return;
  await admin.from("orders").update({ status }).eq("id", id);
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/orders" }));
}
