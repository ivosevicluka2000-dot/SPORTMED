import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateLeadAction } from "./_actions";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "closed"] as const;

export default async function AdminLeadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("leads")
    .select("id, source, name, email, phone, message, status, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  type Row = {
    id: string;
    source: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    message: string | null;
    status: string;
    notes: string | null;
    created_at: string;
  };
  const rows = (data as Row[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-semibold text-navy">
          {t("leads.title")}
        </h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/admin/leads/export"
          className="bg-navy text-white px-4 py-2 rounded-md text-sm hover:bg-navy/90"
        >
          {t("leads.export")}
        </a>
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-500">{t("leads.empty")}</p>
      ) : (
        <div className="space-y-3">
          {rows.map((l) => (
            <details
              key={l.id}
              className="bg-white border border-gray-200 rounded-xl"
            >
              <summary className="cursor-pointer px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-navy font-medium truncate">
                    {l.name ?? l.email ?? "—"}{" "}
                    <span className="text-xs text-gray-400">
                      ({l.source})
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {l.email} · {l.phone ?? ""}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-gray-100">
                  {l.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(l.created_at).toLocaleDateString()}
                </span>
              </summary>
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                {l.message && (
                  <div>
                    <div className="text-xs uppercase text-gray-500 mb-1">
                      {t("leads.message")}
                    </div>
                    <p className="text-sm text-navy whitespace-pre-wrap">
                      {l.message}
                    </p>
                  </div>
                )}
                <form action={updateLeadAction} className="space-y-2">
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select
                      name="status"
                      defaultValue={l.status}
                      className="px-3 py-2 rounded-md border border-gray-200 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      name="notes"
                      defaultValue={l.notes ?? ""}
                      placeholder={t("leads.notes")}
                      className="md:col-span-2 px-3 py-2 rounded-md border border-gray-200 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-navy text-white px-4 py-2 rounded-md text-sm hover:bg-navy/90"
                  >
                    {t("common.save")}
                  </button>
                </form>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
