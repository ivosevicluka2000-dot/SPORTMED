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
function firstUrl(v: FormDataEntryValue | null): string | null {
  const str = s(v);
  if (!str) return null;
  try {
    const arr = JSON.parse(str);
    if (Array.isArray(arr) && typeof arr[0] === "string") return arr[0];
  } catch {
    // raw URL
  }
  return str || null;
}

export type ActionState = { error?: string } | undefined;

export async function upsertCategoryAction(
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
    title: { sr: s(formData.get("title_sr")), en: s(formData.get("title_en")) },
    description: {
      sr: s(formData.get("description_sr")),
      en: s(formData.get("description_en")),
    },
    image_url: firstUrl(formData.get("image_url")),
    sort_order: Math.round(num(formData.get("sort_order"))),
  };

  const admin = adminClient();
  if (id) {
    const { error } = await admin
      .from("product_categories")
      .update(payload)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await admin.from("product_categories").insert(payload);
    if (error) return { error: error.message };
  }
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/categories" }));
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData.get("id"));
  const locale = (s(formData.get("locale")) || "sr") as Locale;
  if (!id) return;
  const admin = adminClient();
  await admin.from("product_categories").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/categories" }));
}
