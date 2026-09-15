import type { RehabWorkspace } from "./types";

export const CLINIC_REPORT_LOGO = "/brand/clinic-logo.png";
export const CLUB_LOGO_BUCKET = "rehab-club-logos";
export const MAX_CLUB_LOGO_BYTES = 2 * 1024 * 1024;

export function reportLogoUrl(
  workspace: Pick<RehabWorkspace, "id" | "kind" | "logo_path">,
  storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string | null {
  if (workspace.kind === "clinic") return CLINIC_REPORT_LOGO;
  const path = workspace.logo_path;
  // Only this club's generated storage objects can become its report logo.
  if (!storageUrl || !path || !path.startsWith(`${workspace.id}/`) ||
      !/^[0-9a-f-]+\/[0-9a-f-]+\.png$/.test(path)) return null;
  return `${storageUrl.replace(/\/$/, "")}/storage/v1/object/public/${CLUB_LOGO_BUCKET}/${path}`;
}
