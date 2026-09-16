import { reportLogoUrl } from "./branding.ts";
import type { AppointmentEmailBrand } from "./appointment-email.ts";

export function appointmentEmailBrand(workspace: { id: string; kind: "clinic" | "club"; logo_path?: string | null }): AppointmentEmailBrand {
  const logo = reportLogoUrl(workspace);
  const clinic = workspace.kind === "clinic" && workspace.id === "00000000-0000-0000-0000-000000000101";
  return {
    logoUrl: logo?.startsWith("/") ? `https://www.sportcaremed.com${logo}` : logo,
    ...(clinic ? {
      address: "Vojvode Mišića 21 A, Šabac",
      contactUrl: "https://www.sportcaremed.com/sr/kontakt",
      contactLabel: "+381 69 1982215 · info@sportcaremed.com",
    } : {}),
  };
}
