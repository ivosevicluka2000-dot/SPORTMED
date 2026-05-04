import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("product_categories")
    .select("id, slug, title, sort_order")
    .order("sort_order", { ascending: true });
  type Row = { id: string; slug: string; title: Record<string, string> | null; sort_order: number };
  const rows = (data as Row[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-semibold text-navy">
          {t("categories.title")}
        </h1>
        <Link
          href="/admin/categories/new"
          className="bg-navy text-white px-4 py-2 rounded-md text-sm hover:bg-navy/90"
        >
          + {t("common.new")}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-500">{t("categories.empty")}</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">{t("categories.title_field")}</th>
                <th className="text-left px-4 py-3">{t("categories.slug")}</th>
                <th className="text-right px-4 py-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-navy">
                    {c.title?.[locale] ?? c.title?.sr ?? c.slug}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={{ pathname: "/admin/categories/[id]", params: { id: c.id } }}
                      className="text-teal hover:underline"
                    >
                      {t("common.edit")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
