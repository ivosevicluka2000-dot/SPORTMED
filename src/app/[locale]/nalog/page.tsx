import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getPathname, type Locale } from "@/i18n/routing";
import ClaimGuestOrdersButton from "@/components/account/ClaimGuestOrdersButton";
import SignOutButton from "@/components/account/SignOutButton";

interface OrderRow {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.nav" });
  return { title: t("dashboard"), robots: { index: false, follow: false } };
}

export default async function AccountDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    redirect(
      `${getPathname({ locale: locale as Locale, href: "/nalog/prijava" })}?next=${encodeURIComponent(
        getPathname({ locale: locale as Locale, href: "/nalog" })
      )}`
    );
  }

  const t = await getTranslations({ locale, namespace: "account" });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", auth.user.id)
    .maybeSingle();

  const { data: ordersData } = await supabase
    .from("orders")
    .select("id, order_number, total_amount, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const orders: OrderRow[] = ordersData ?? [];
  const displayName =
    profile?.full_name?.trim() || auth.user.email?.split("@")[0] || "";

  const dateFmt = new Intl.DateTimeFormat(locale === "sr" ? "sr-RS" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const moneyFmt = new Intl.NumberFormat(locale === "sr" ? "sr-RS" : "en-GB");

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4 mb-10">
          <div>
            <div className="w-8 h-px bg-[var(--color-gold)] mb-4" />
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-navy tracking-tight">
              {t("dashboard.greeting", { name: displayName })}
            </h1>
          </div>
          <SignOutButton />
        </div>

        <div className="border border-gray-200 rounded-lg p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <h2 className="font-heading text-xl text-navy">
              {t("dashboard.yourOrders")}
            </h2>
            <ClaimGuestOrdersButton />
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 mb-6">
                {t("dashboard.noOrders")}
              </p>
              <Link
                href="/prodavnica"
                className="inline-block bg-navy text-white px-6 py-2.5 rounded-md text-sm font-medium tracking-wide hover:bg-navy/90 transition-colors"
              >
                {t("dashboard.shopNow")}
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:-mx-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                    <th className="px-6 sm:px-8 py-3">
                      {t("dashboard.orderNumber")}
                    </th>
                    <th className="px-4 py-3">{t("dashboard.orderDate")}</th>
                    <th className="px-4 py-3">{t("dashboard.orderTotal")}</th>
                    <th className="px-4 py-3">{t("dashboard.orderStatus")}</th>
                    <th className="px-6 sm:px-8 py-3 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-6 sm:px-8 py-4 font-mono text-navy">
                        {o.order_number}
                      </td>
                      <td className="px-4 py-4 text-gray-500">
                        {dateFmt.format(new Date(o.created_at))}
                      </td>
                      <td className="px-4 py-4 text-navy">
                        {moneyFmt.format(o.total_amount)} RSD
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {t(`status.${o.status as "pending"}`)}
                      </td>
                      <td className="px-6 sm:px-8 py-4 text-right">
                        <Link
                          href={{
                            pathname: "/nalog/porudzbine/[orderNumber]",
                            params: { orderNumber: o.order_number },
                          }}
                          className="text-teal hover:underline"
                        >
                          {t("dashboard.viewOrder")} →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
