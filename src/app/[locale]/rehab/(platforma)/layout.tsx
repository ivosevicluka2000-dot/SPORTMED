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
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);

  if (access.workspaces.length === 0) {
    return (
      <main className="min-h-[65vh] bg-gray-50 px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Rehab platforma još nije aktivirana u bazi. Primenite migraciju
          <code className="mx-1 rounded bg-white px-1.5 py-0.5 text-sm">
            0004_rehab_basic.sql
          </code>
          .
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
              <p className="font-heading text-xl font-semibold text-navy">Rehab platforma</p>
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
                Glavni admin
              </Link>
            )}
            <form action={rehabSignOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button className="rounded-md px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-navy">
                Odjavi se
              </button>
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
