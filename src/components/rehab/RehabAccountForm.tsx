import { useTranslations } from "next-intl";
import { addSimpleRehabAccountAction } from "@/app/[locale]/admin/rehab/_management-actions";
import { RehabForm } from "./RehabForm";
import { RehabSubmitButton } from "./RehabSubmitButton";
import { rehabInputClass, rehabLabelClass } from "./RehabUi";
import type { Locale } from "@/i18n/routing";

export function RehabAccountForm({ locale, workspaceId, kind, player, workspaceName }: {
  locale: Locale; workspaceId: string; workspaceName: string; kind: "clinic" | "club";
  player?: { id: string; name: string; email: string | null };
}) {
  const t = useTranslations("rehab");
  const scope = player ? t("labelThisAccountCanOnlyViewItsOwn")
    : kind === "clinic" ? t("labelThePhysiotherapistCanViewAndEditAll")
    : t("labelThisPersonCanViewAllPlayersAt", {v0: workspaceName});
  return <RehabForm action={addSimpleRehabAccountAction} className="space-y-4">
    <input type="hidden" name="locale" value={locale} />
    <input type="hidden" name="workspace_id" value={workspaceId} />
    <input type="hidden" name="role" value={player ? "player" : kind === "clinic" ? "therapist" : "viewer"} />
    {player && <><input type="hidden" name="patient_id" value={player.id} /><input type="hidden" name="return_to" value="patient" /></>}
    <p className="rounded-lg bg-teal-50 p-3 text-sm leading-6 text-teal-dark">{scope}</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span className={rehabLabelClass}>{t("labelFullName")}</span><input name="full_name" required minLength={2} maxLength={100} defaultValue={player?.name} className={rehabInputClass} /></label>
      <label><span className={rehabLabelClass}>{t("labelLoginEmail")}</span><input name="email" type="email" required defaultValue={player?.email ?? ""} className={rehabInputClass} /></label>
      <label className="sm:col-span-2"><span className={rehabLabelClass}>{t("labelInitialPasswordForANewAccount")}</span><input name="password" type="password" minLength={8} maxLength={72} autoComplete="new-password" className={rehabInputClass} /><span className="mt-1 block text-xs text-gray-500">{t("labelAtLeastCharactersIfThePersonAlready")}</span></label>
    </div>
    <RehabSubmitButton className="rounded-md bg-navy px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{player ? t("labelEnablePlayerLogin") : kind === "clinic" ? t("labelAddPhysiotherapist") : t("labelAddAPersonWithAccess")}</RehabSubmitButton>
  </RehabForm>;
}
