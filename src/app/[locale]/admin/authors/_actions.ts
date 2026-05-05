"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, adminClient } from "@/lib/admin-helpers";
import { getPathname, type Locale } from "@/i18n/routing";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function firstUrl(v: FormDataEntryValue | null): string | null {
  const str = s(v);
  if (!str) return null;
  try {
    const arr = JSON.parse(str);
    if (Array.isArray(arr) && typeof arr[0] === "string") return arr[0];
  } catch {
    // fallthrough — treat as raw URL
  }
  return str || null;
}

export type ActionState = { error?: string } | undefined;

export async function upsertAuthorAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Not authorized" };
  }
  const id = s(formData.get("id")) || null;
  const locale = (s(formData.get("locale")) || "sr") as Locale;
  const name = s(formData.get("name"));
  if (!name) return { error: "Name is required" };

  const payload = {
    name,
    role: s(formData.get("role")) || null,
    image_url: firstUrl(formData.get("image_url")),
    bio: { sr: s(formData.get("bio_sr")), en: s(formData.get("bio_en")) },
  };

  const admin = adminClient();
  if (id) {
    const { error } = await admin.from("blog_authors").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await admin.from("blog_authors").insert(payload);
    if (error) return { error: error.message };
  }
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/authors" }));
}

export async function deleteAuthorAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = s(formData.get("id"));
  const locale = (s(formData.get("locale")) || "sr") as Locale;
  if (!id) return;
  const admin = adminClient();
  await admin.from("blog_authors").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(getPathname({ locale, href: "/admin/authors" }));
}
