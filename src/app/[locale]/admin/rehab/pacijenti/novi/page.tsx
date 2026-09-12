import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { createRehabPatientAction } from "@/app/[locale]/admin/rehab/_actions";
import { getRehabAccessContext, selectRehabWorkspace } from "@/lib/rehab/access";
import { dateInputValue } from "@/lib/rehab/dates";
import type { Locale } from "@/i18n/routing";
import {
  RehabAlert,
  RehabPageHeader,
  RehabPanel,
  WorkspaceTabs,
  rehabInputClass,
  rehabLabelClass,
  rehabUrl,
} from "@/components/rehab/RehabUi";
import { RehabForm } from "@/components/rehab/RehabForm";
import { RehabSubmitButton } from "@/components/rehab/RehabSubmitButton";

export const dynamic = "force-dynamic";

export default async function NewRehabPatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ workspace?: string; error?: string }>;
}) {
  const t = await getTranslations("rehab");
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;

  return (
    <div>
      <RehabPageHeader
        eyebrow={workspace.name}
        title={workspace.kind === "club" ? t("labelNewPlayer") : t("labelNewPatient")}
        description={t("labelCreateARecordDailyTherapiesAndA")}
      />
      <WorkspaceTabs
        access={access}
        selectedId={workspace.id}
        locale={locale}
        href="/rehab/pacijenti/novi"
      />
      <RehabAlert error={query.error} />

      {!workspace.canEdit ? (
        <RehabPanel>{t("labelYouHaveViewOnlyAccess")}</RehabPanel>
      ) : (
        <RehabPanel className="max-w-4xl">
          <RehabForm action={createRehabPatientAction} className="space-y-5">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="workspace_id" value={workspace.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={rehabLabelClass}>{t("labelFirstName")}</span>
                <input name="first_name" required maxLength={100} className={rehabInputClass} />
              </label>
              <label>
                <span className={rehabLabelClass}>{t("labelLastName")}</span>
                <input name="last_name" required maxLength={100} className={rehabInputClass} />
              </label>
              <label>
                <span className={rehabLabelClass}>{t("labelEmail")}</span>
                <input name="email" type="email" className={rehabInputClass} />
              </label>
              <label>
                <span className={rehabLabelClass}>{t("labelPhone")}</span>
                <input name="phone" type="tel" className={rehabInputClass} />
              </label>
              <label>
                <span className={rehabLabelClass}>{t("labelDateOfBirth")}</span>
                <input name="birth_date" type="date" className={rehabInputClass} />
              </label>
              <label>
                <span className={rehabLabelClass}>{t("labelRehabilitationStart")}</span>
                <input
                  name="started_on"
                  type="date"
                  required
                  defaultValue={dateInputValue()}
                  className={rehabInputClass}
                />
              </label>
            </div>
            <label>
              <span className={rehabLabelClass}>{t("labelProblemOrInjury")}</span>
              <textarea name="problem" rows={3} maxLength={3000} className={rehabInputClass} />
            </label>
            <label>
              <span className={rehabLabelClass}>{t("labelInitialNotes")}</span>
              <textarea name="notes" rows={4} maxLength={5000} className={rehabInputClass} />
            </label>
            <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
              <RehabSubmitButton className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                 {t("labelSaveRecord")} </RehabSubmitButton>
              <Link
                href={rehabUrl(locale, "/rehab/pacijenti", { workspace: workspace.id })}
                className="rounded-md border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                 {t("labelCancel")} </Link>
            </div>
          </RehabForm>
        </RehabPanel>
      )}
    </div>
  );
}
