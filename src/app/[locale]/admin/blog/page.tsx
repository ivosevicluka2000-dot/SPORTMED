import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("id, title, slug, language, published_at, translation_group")
    .order("created_at", { ascending: false })
    .limit(200);
  type Row = {
    id: string;
    title: string;
    slug: string;
    language: "sr" | "en";
    published_at: string | null;
    translation_group: string;
  };
  const rows = (data as Row[]) ?? [];
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-semibold text-navy">
          {t("blog.title")}
        </h1>
        <Link
          href="/admin/blog/new"
          className="bg-navy text-white px-4 py-2 rounded-md text-sm hover:bg-navy/90"
        >
          + {t("common.new")}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-500">{t("blog.empty")}</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">{t("blog.postTitle")}</th>
                <th className="text-left px-4 py-3">{t("blog.slug")}</th>
                <th className="text-left px-4 py-3">{t("blog.language")}</th>
                <th className="text-left px-4 py-3">{t("blog.publishedAt")}</th>
                <th className="text-left px-4 py-3">{t("blog.status")}</th>
                <th className="text-right px-4 py-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                // Server component renders once per request; lint rule meant for
                // client components doesn't apply here.
                // eslint-disable-next-line react-hooks/purity
                const now = Date.now();
                const ts = p.published_at ? new Date(p.published_at).getTime() : null;
                const statusKey =
                  ts === null
                    ? "statusDraft"
                    : ts > now
                    ? "statusScheduled"
                    : "statusPublished";
                const badgeClass =
                  ts === null
                    ? "bg-gray-100 text-gray-600"
                    : ts > now
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700";
                return (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-navy">{p.title}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {p.slug}
                    </td>
                    <td className="px-4 py-3">{p.language.toUpperCase()}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.published_at
                        ? new Date(p.published_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}
                      >
                        {t(`blog.${statusKey}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={{ pathname: "/admin/blog/[id]", params: { id: p.id } }}
                        className="text-teal hover:underline"
                      >
                        {t("common.edit")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
