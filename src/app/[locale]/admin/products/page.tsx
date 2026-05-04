import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("id, slug, name, price, stock, active, featured, product_type")
    .order("created_at", { ascending: false });
  type Row = {
    id: string;
    slug: string;
    name: Record<string, string> | null;
    price: number;
    stock: number;
    active: boolean;
    featured: boolean;
    product_type: string;
  };
  const rows = (products as Row[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-semibold text-navy">
          {t("products.title")}
        </h1>
        <Link
          href="/admin/products/new"
          className="bg-navy text-white px-4 py-2 rounded-md text-sm hover:bg-navy/90"
        >
          + {t("common.new")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">{t("products.empty")}</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">{t("products.name")}</th>
                <th className="text-left px-4 py-3">{t("products.slug")}</th>
                <th className="text-right px-4 py-3">{t("products.price")}</th>
                <th className="text-right px-4 py-3">{t("products.stock")}</th>
                <th className="text-left px-4 py-3">{t("products.active")}</th>
                <th className="text-right px-4 py-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-navy">
                    {p.name?.[locale] ?? p.name?.sr ?? p.slug}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.slug}</td>
                  <td className="px-4 py-3 text-right">
                    {p.price.toLocaleString("sr-RS")} RSD
                  </td>
                  <td className="px-4 py-3 text-right">{p.stock}</td>
                  <td className="px-4 py-3">
                    {p.active ? t("common.yes") : t("common.no")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={{ pathname: "/admin/products/[id]", params: { id: p.id } }}
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
