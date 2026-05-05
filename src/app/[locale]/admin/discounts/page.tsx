import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("discount_codes")
    .select(
      "id, code, type:discount_type, value, used_count, max_uses, active, valid_until"
    )
    .order("created_at", { ascending: false });
  type Row = {
    id: string;
    code: string;
    type: "percent" | "fixed";
    value: number;
    used_count: number;
    max_uses: number | null;
    active: boolean;
    valid_until: string | null;
  };
  const rows = (data as Row[]) ?? [];
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-semibold text-navy">
          {t("discounts.title")}
        </h1>
        <Link
          href="/admin/discounts/new"
          className="bg-navy text-white px-4 py-2 rounded-md text-sm hover:bg-navy/90"
        >
          + {t("common.new")}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-500">{t("discounts.empty")}</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">{t("discounts.code")}</th>
                <th className="text-left px-4 py-3">{t("discounts.type")}</th>
                <th className="text-right px-4 py-3">{t("discounts.value")}</th>
                <th className="text-right px-4 py-3">{t("discounts.usedCount")}</th>
                <th className="text-left px-4 py-3">{t("discounts.active")}</th>
                <th className="text-right px-4 py-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-navy font-mono">{d.code}</td>
                  <td className="px-4 py-3">
                    {d.type === "percent" ? "%" : "RSD"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {d.value}
                    {d.type === "percent" ? "%" : ""}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {d.used_count}
                    {d.max_uses != null ? `/${d.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {d.active ? t("common.yes") : t("common.no")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={{ pathname: "/admin/discounts/[id]", params: { id: d.id } }}
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
