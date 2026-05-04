import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link, getPathname } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import SignOutButton from "@/components/account/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const t = await getTranslations({ locale, namespace: "admin" });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = getPathname({ locale, href: "/admin" });
    const loginPath = getPathname({ locale, href: "/nalog/prijava" });
    redirect(`${loginPath}?next=${encodeURIComponent(next)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-3xl font-semibold text-navy mb-3">
            {t("forbidden.title")}
          </h1>
          <p className="text-gray-600 mb-6">{t("forbidden.body")}</p>
          <SignOutButton />
        </div>
      </main>
    );
  }

  const navItems: Array<{ href: "/admin" | "/admin/products" | "/admin/categories" | "/admin/discounts" | "/admin/orders" | "/admin/blog" | "/admin/authors" | "/admin/leads" | "/admin/newsletter"; label: string }> = [
    { href: "/admin", label: t("nav.dashboard") },
    { href: "/admin/products", label: t("nav.products") },
    { href: "/admin/categories", label: t("nav.categories") },
    { href: "/admin/discounts", label: t("nav.discounts") },
    { href: "/admin/orders", label: t("nav.orders") },
    { href: "/admin/blog", label: t("nav.blog") },
    { href: "/admin/authors", label: t("nav.authors") },
    { href: "/admin/leads", label: t("nav.leads") },
    { href: "/admin/newsletter", label: t("nav.newsletter") },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-white border-r border-gray-200 px-4 py-6 sticky top-0 hidden md:block">
          <div className="mb-8 px-2">
            <div className="font-heading text-lg font-semibold text-navy">
              Sport Care Admin
            </div>
            {profile.full_name && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                {profile.full_name}
              </div>
            )}
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-navy transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 px-2">
            <SignOutButton
              className="text-sm text-gray-500 hover:text-navy"
              label={t("nav.signOut")}
            />
          </div>
        </aside>
        <main className="flex-1 p-6 md:p-10">
          <nav className="md:hidden mb-6 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-md text-xs bg-white border border-gray-200 text-gray-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {children}
        </main>
      </div>
    </div>
  );
}
