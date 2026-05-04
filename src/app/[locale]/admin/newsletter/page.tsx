import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("newsletter_subscribers")
    .select("id, email, source, unsubscribed, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  type Row = {
    id: string;
    email: string;
    source: string | null;
    unsubscribed: boolean;
    created_at: string;
  };
  const rows = (data as Row[]) ?? [];
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-semibold text-navy">
          {t("newsletter.title")}
        </h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/newsletter/export"
          className="bg-navy text-white px-4 py-2 rounded-md text-sm hover:bg-navy/90"
        >
          {t("newsletter.export")}
        </a>
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-500">{t("newsletter.empty")}</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">{t("newsletter.email")}</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">{t("newsletter.date")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-navy">{s.email}</td>
                  <td className="px-4 py-3 text-gray-500">{s.source ?? "—"}</td>
                  <td className="px-4 py-3">
                    {s.unsubscribed ? t("newsletter.unsubscribed") : "Active"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(s.created_at).toLocaleDateString()}
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
