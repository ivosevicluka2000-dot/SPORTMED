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

export const dynamic = "force-dynamic";

export default async function NewRehabPatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ workspace?: string; error?: string }>;
}) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;

  return (
    <div>
      <RehabPageHeader
        eyebrow={workspace.name}
        title={workspace.kind === "club" ? "Novi igrač" : "Novi pacijent"}
        description="Otvorite karton. Dnevne terapije i plan dodaju se nakon čuvanja."
      />
      <WorkspaceTabs
        access={access}
        selectedId={workspace.id}
        locale={locale}
        href="/rehab/pacijenti/novi"
      />
      <RehabAlert error={query.error} />

      {!workspace.canEdit ? (
        <RehabPanel>Imate pristup samo za pregled.</RehabPanel>
      ) : (
        <RehabPanel className="max-w-4xl">
          <form action={createRehabPatientAction} className="space-y-5">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="workspace_id" value={workspace.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={rehabLabelClass}>Ime *</span>
                <input name="first_name" required maxLength={100} className={rehabInputClass} />
              </label>
              <label>
                <span className={rehabLabelClass}>Prezime *</span>
                <input name="last_name" required maxLength={100} className={rehabInputClass} />
              </label>
              <label>
                <span className={rehabLabelClass}>Email</span>
                <input name="email" type="email" className={rehabInputClass} />
              </label>
              <label>
                <span className={rehabLabelClass}>Telefon</span>
                <input name="phone" type="tel" className={rehabInputClass} />
              </label>
              <label>
                <span className={rehabLabelClass}>Datum rođenja</span>
                <input name="birth_date" type="date" className={rehabInputClass} />
              </label>
              <label>
                <span className={rehabLabelClass}>Početak rehabilitacije *</span>
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
              <span className={rehabLabelClass}>Problem ili povreda</span>
              <textarea name="problem" rows={3} maxLength={3000} className={rehabInputClass} />
            </label>
            <label>
              <span className={rehabLabelClass}>Početna napomena</span>
              <textarea name="notes" rows={4} maxLength={5000} className={rehabInputClass} />
            </label>
            <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
              <button className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-dark">
                Sačuvaj karton
              </button>
              <Link
                href={rehabUrl(locale, "/rehab/pacijenti", { workspace: workspace.id })}
                className="rounded-md border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Otkaži
              </Link>
            </div>
          </form>
        </RehabPanel>
      )}
    </div>
  );
}
