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
function arr(v: FormDataEntryValue | null): string[] {
  if (typeof v !== "string" || !v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export type ActionState = { error?: string } | undefined;

export async function upsertProductAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Not authorized" };
  }
  const id = s(formData.get("id")) || null;
  const slug = s(formData.get("slug"));
  const locale = (s(formData.get("locale")) || "sr") as Locale;
  if (!slug) return { error: "Slug is required" };

  const payload = {
    slug,
    name: { sr: s(formData.get("name_sr")), en: s(formData.get("name_en")) },
    description: {
      sr: s(formData.get("description_sr")),
      en: s(formData.get("description_en")),
    },
    images: arr(formData.get("images")),
    price: Math.round(num(formData.get("price"))),
    compare_at_price: formData.get("compare_at_price")
      ? Math.round(num(formData.get("compare_at_price")))
      : null,
    category_id: s(formData.get("category_id")) || null,
    stock: Math.round(num(formData.get("stock"))),
    featured: bool(formData.get("featured")),
    active: bool(formData.get("active")),
    product_type: s(formData.get("product_type")) === "pdf" ? "pdf" : "physical",
  };

  const admin = adminClient();
  if (id) {
    const { error } = await admin.from("products").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await admin.from("products").insert(payload);
    if (error) return { error: error.message };
  }
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/products" }));
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData.get("id"));
  const locale = (s(formData.get("locale")) || "sr") as Locale;
  if (!id) return;
  const admin = adminClient();
  await admin.from("products").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/products" }));
}
