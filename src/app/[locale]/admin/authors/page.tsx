import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminAuthorsPage() {
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_authors")
    .select("id, name, role")
    .order("name", { ascending: true });
  type Row = { id: string; name: string; role: string | null };
  const rows = (data as Row[]) ?? [];
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-semibold text-navy">
          {t("authors.title")}
        </h1>
        <Link
          href="/admin/authors/new"
          className="bg-navy text-white px-4 py-2 rounded-md text-sm hover:bg-navy/90"
        >
          + {t("common.new")}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-500">{t("authors.empty")}</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">{t("authors.name")}</th>
                <th className="text-left px-4 py-3">{t("authors.role")}</th>
                <th className="text-right px-4 py-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-navy">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500">{a.role ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={{ pathname: "/admin/authors/[id]", params: { id: a.id } }}
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
