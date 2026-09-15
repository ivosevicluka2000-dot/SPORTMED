"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-helpers";
import { requireRehabWorkspace } from "./access";
import { CLUB_LOGO_BUCKET } from "./branding";
import { prepareClubLogo } from "./logo-upload";

export async function uploadClubLogo(locale: string, workspaceId: string, form: FormData) {
  await requireAdmin();
  const { supabase, workspace } = await requireRehabWorkspace(locale === "en" ? "en" : "sr", workspaceId, "manage");
  if (workspace.kind !== "club") return { error: "clubLogoSaveError" };
  const file = form.get("logo");
  if (!(file instanceof File)) return { error: "invalidClubLogo" };
  let pixels: Buffer;
  try {
    pixels = await prepareClubLogo(file);
  } catch {
    return { error: "invalidClubLogo" };
  }
  const path = `${workspace.id}/${randomUUID()}.png`;
  const bucket = supabase.storage.from(CLUB_LOGO_BUCKET);
  const { error: uploadError } = await bucket.upload(path, pixels, { contentType: "image/png", upsert: false });
  if (uploadError) return { error: "clubLogoSaveError" };
  const { data, error } = await supabase.from("rehab_workspaces")
    .update({ logo_path: path }).eq("id", workspace.id).eq("kind", "club").select("id").single();
  if (error || !data) {
    await bucket.remove([path]);
    return { error: "clubLogoSaveError" };
  }
  // Keep previous immutable images available to reports already open for printing.
  revalidatePath("/", "layout");
  return { saved: true };
}
