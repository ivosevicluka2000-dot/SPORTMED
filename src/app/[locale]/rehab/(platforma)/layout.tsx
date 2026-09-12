import { getTranslations } from "next-intl/server";
import { RehabLanguageSwitcher } from "@/components/rehab/RehabLanguageSwitcher";
import { Suspense } from "react";
import { Activity, Shield } from "lucide-react";
import { getRehabAccessContext } from "@/lib/rehab/access";
import { Link, type Locale } from "@/i18n/routing";
import { rehabSignOutAction } from "@/lib/rehab/auth-actions";
import { RehabNavigation } from "@/components/rehab/RehabNavigation";

export const dynamic = "force-dynamic";

export default async function RehabPlatformLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations("rehab");
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);

  if (access.workspaces.length === 0) {
    const message = access.loadError
      ? t("labelTheRehabPlatformCannotLoadDataRight")
      : access.isGlobalAdmin
        ? t("labelNoRehabWorkspacesAreConfiguredCheckThat")
        : t("labelYourAccountHasNotBeenGrantedAccess");
    return (
      <main className="min-h-[65vh] bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          {message}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="rehab-platform-chrome border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-dark">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold text-navy">{t("labelRehabPlatform")}</p>
              <p className="text-xs text-gray-500">{access.fullName}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {access.isGlobalAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Shield className="h-4 w-4" />
                 {t("labelMainAdministrator")} </Link>
            )}
            <RehabLanguageSwitcher />
            <form action={rehabSignOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button className="rounded-md px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-navy">
                 {t("labelSignOut")} </button>
            </form>
          </div>
        </div>
        <Suspense fallback={<div className="h-11" />}>
          <RehabNavigation
            isGlobalAdmin={access.isGlobalAdmin}
            workspaces={access.workspaces}
          />
        </Suspense>
      </header>
      <main className="rehab-platform-content mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
