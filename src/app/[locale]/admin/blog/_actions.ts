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
function multi(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
}
function dateOrNull(v: FormDataEntryValue | null): string | null {
  const t = s(v);
  if (!t) return null;
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export async function upsertBlogPostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData.get("id")) || null;
  const locale = (s(formData.get("locale")) || "sr") as Locale;
  const language = s(formData.get("language"));
  if (language !== "sr" && language !== "en") throw new Error("Language required");

  const slug = s(formData.get("slug"));
  const title = s(formData.get("title"));
  const excerpt = s(formData.get("excerpt"));
  if (!slug || !title || !excerpt) throw new Error("Required fields missing");

  const payloadBase = {
    slug,
    language,
    title,
    excerpt,
    body_markdown: s(formData.get("body_markdown")),
    main_image_url: firstUrl(formData.get("main_image_url")),
    author_id: s(formData.get("author_id")) || null,
    category_ids: multi(formData, "category_ids"),
    related_post_ids: multi(formData, "related_post_ids"),
    reading_time: Math.max(1, Math.round(num(formData.get("reading_time"), 1))),
    published_at: dateOrNull(formData.get("published_at")),
  };

  const admin = adminClient();
  if (id) {
    const { error } = await admin.from("blog_posts").update(payloadBase).eq("id", id);
    if (error) throw error;
  } else {
    const translationGroup = s(formData.get("translation_group"));
    const insertPayload: Record<string, unknown> = { ...payloadBase };
    if (translationGroup) insertPayload.translation_group = translationGroup;
    const { error } = await admin.from("blog_posts").insert(insertPayload);
    if (error) throw error;
  }
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/blog" }));
}

export async function deleteBlogPostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData.get("id"));
  const locale = (s(formData.get("locale")) || "sr") as Locale;
  if (!id) return;
  const admin = adminClient();
  await admin.from("blog_posts").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/blog" }));
}
