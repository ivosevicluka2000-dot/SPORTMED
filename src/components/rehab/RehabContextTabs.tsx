import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Locale } from "@/i18n/routing";
import { rehabUrl } from "./RehabUi";

export function RehabContextTabs({ locale, workspace, current, isAdmin }: {
  locale: Locale; workspace: { id: string; kind: string }; current: "patients" | "access"; isAdmin: boolean;
}) {
  const t = useTranslations("rehab");
  if (!isAdmin) return null;
  return <nav aria-label={t("labelManageClinicOrClub")} className="mb-6 flex flex-wrap gap-2">
    {workspace.kind === "club" && <Link href={rehabUrl(locale, "/rehab/klubovi")} className="rounded-md border px-4 py-2 text-sm text-gray-600">{t("labelAllClubs")}</Link>}
    <Link href={rehabUrl(locale, "/rehab/pacijenti", { workspace: workspace.id })} aria-current={current === "patients" ? "page" : undefined} className={`rounded-md px-4 py-2 text-sm ${current === "patients" ? "bg-navy text-white" : "border bg-white text-gray-700"}`}>{workspace.kind === "club" ? t("labelPlayers") : t("labelPatients")}</Link>
    <Link href={rehabUrl(locale, "/rehab/tim", { workspace: workspace.id })} aria-current={current === "access" ? "page" : undefined} className={`rounded-md px-4 py-2 text-sm ${current === "access" ? "bg-navy text-white" : "border bg-white text-gray-700"}`}>{workspace.kind === "club" ? t("labelPeopleWithAccess") : t("labelPhysiotherapists")}</Link>
  </nav>;
}
