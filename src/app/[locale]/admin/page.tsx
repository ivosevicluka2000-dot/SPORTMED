import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Link, getPathname, type Locale } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { getRehabAccessContext } from "@/lib/rehab/access";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Users,
  Mail,
  AlertTriangle,
  Wallet,
  Receipt,
  Activity,
} from "lucide-react";

export const dynamic = "force-dynamic";

const REVENUE_STATUSES = [
  "confirmed",
  "paid",
  "processing",
  "shipped",
  "delivered",
];

type OrderRow = {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  customer: { name?: string; email?: string } | null;
  items: Array<{
    product_id?: string;
    product_name?: string;
    quantity?: number;
    price?: number;
  }> | null;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function formatRsd(n: number) {
  return `${Math.round(n).toLocaleString("sr-RS")} RSD`;
}

async function getAnalytics() {
  const admin = createAdminClient();
  const since = daysAgo(60).toISOString();

  const [
    productsCount,
    ordersCount,
    postsCount,
    leadsNew,
    newsletterCount,
    lowStock,
    recentOrders,
    revenueOrders,
    statusOrders,
  ] = await Promise.all([
    admin.from("products").select("*", { count: "exact", head: true }),
    admin.from("orders").select("*", { count: "exact", head: true }),
    admin.from("blog_posts").select("*", { count: "exact", head: true }),
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
    admin
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true }),
    admin
      .from("products")
      .select("id, name, stock, active")
      .lte("stock", 5)
      .eq("active", true)
      .order("stock", { ascending: true })
      .limit(5),
    admin
      .from("orders")
      .select(
        "id, order_number, total_amount, status, payment_method, created_at, customer, items"
      )
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("orders")
      .select("total_amount, status, created_at, items")
      .in("status", REVENUE_STATUSES)
      .gte("created_at", since),
    admin
      .from("orders")
      .select("status")
      .gte("created_at", daysAgo(30).toISOString()),
  ]);

  const orders30: { total_amount: number; created_at: string }[] = [];
  const ordersPrev30: { total_amount: number }[] = [];
  const cutoff30 = daysAgo(30).getTime();

  let revenueAll = 0;
  const dailyRevenue = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = daysAgo(i);
    dailyRevenue.set(d.toISOString().slice(0, 10), 0);
  }

  const productSales = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();

  for (const o of (revenueOrders.data ?? []) as Array<{
    total_amount: number;
    status: string;
    created_at: string;
    items: OrderRow["items"];
  }>) {
    revenueAll += o.total_amount ?? 0;
    const ts = new Date(o.created_at).getTime();
    if (ts >= cutoff30) {
      orders30.push({ total_amount: o.total_amount, created_at: o.created_at });
    } else {
      ordersPrev30.push({ total_amount: o.total_amount });
    }
    const dayKey = new Date(o.created_at).toISOString().slice(0, 10);
    if (dailyRevenue.has(dayKey)) {
      dailyRevenue.set(
        dayKey,
        (dailyRevenue.get(dayKey) ?? 0) + (o.total_amount ?? 0)
      );
    }
    for (const it of o.items ?? []) {
      if (!it.product_id) continue;
      const prev = productSales.get(it.product_id) ?? {
        name: it.product_name ?? "—",
        quantity: 0,
        revenue: 0,
      };
      prev.quantity += it.quantity ?? 0;
      prev.revenue += (it.quantity ?? 0) * (it.price ?? 0);
      productSales.set(it.product_id, prev);
    }
  }

  const revenue30 = orders30.reduce((s, o) => s + o.total_amount, 0);
  const revenuePrev30 = ordersPrev30.reduce((s, o) => s + o.total_amount, 0);
  const aov30 = orders30.length ? revenue30 / orders30.length : 0;
  const revenueChange =
    revenuePrev30 > 0
      ? ((revenue30 - revenuePrev30) / revenuePrev30) * 100
      : revenue30 > 0
        ? 100
        : 0;

  const statusCounts = new Map<string, number>();
  for (const r of (statusOrders.data ?? []) as { status: string }[]) {
    statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
  }

  const topProducts = [...productSales.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    counts: {
      products: productsCount.count ?? 0,
      orders: ordersCount.count ?? 0,
      posts: postsCount.count ?? 0,
      leads: leadsNew.count ?? 0,
      newsletter: newsletterCount.count ?? 0,
    },
    revenue: {
      total: revenueAll,
      last30: revenue30,
      change: revenueChange,
      aov: aov30,
      orders30: orders30.length,
    },
    daily: [...dailyRevenue.entries()].map(([date, value]) => ({
      date,
      value,
    })),
    statusCounts,
    topProducts,
    lowStock: (lowStock.data ?? []) as Array<{
      id: string;
      name: { sr?: string; en?: string };
      stock: number;
    }>,
    recentOrders: (recentOrders.data ?? []) as OrderRow[],
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  awaiting_payment: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  paid: "bg-emerald-100 text-emerald-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-teal-100 text-teal-800",
  cancelled: "bg-rose-100 text-rose-800",
  failed: "bg-red-100 text-red-800",
};

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const access = await getRehabAccessContext(locale as Locale);
  if (!access.isGlobalAdmin) {
    redirect(getPathname({ locale: locale as Locale, href: "/rehab" }));
  }
  const t = await getTranslations("admin.dashboard");

  const a = await getAnalytics();
  const profile = { full_name: access.fullName };
  const maxDaily = Math.max(1, ...a.daily.map((d) => d.value));
  const positive = a.revenue.change >= 0;

  const kpis = [
    {
      label: t("kpi.revenue30"),
      value: formatRsd(a.revenue.last30),
      icon: Wallet,
      accent: "from-teal/15 to-teal/0 text-teal",
      delta: (
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            positive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {positive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          {Math.abs(a.revenue.change).toFixed(1)}% {t("kpi.vsPrev30")}
        </span>
      ),
    },
    {
      label: t("kpi.revenueAll"),
      value: formatRsd(a.revenue.total),
      icon: Receipt,
      accent: "from-navy/10 to-navy/0 text-navy",
      delta: null,
    },
    {
      label: t("kpi.aov"),
      value: formatRsd(a.revenue.aov),
      icon: Activity,
      accent: "from-indigo-500/15 to-indigo-500/0 text-indigo-600",
      delta: null,
    },
    {
      label: t("kpi.orders30"),
      value: a.revenue.orders30.toLocaleString("sr-RS"),
      icon: ShoppingCart,
      accent: "from-amber-400/20 to-amber-400/0 text-amber-700",
      delta: null,
    },
  ];

  const sideStats = [
    { label: t("products"), value: a.counts.products, icon: Package, href: "/admin/products" as const },
    { label: t("orders"), value: a.counts.orders, icon: ShoppingCart, href: "/admin/orders" as const },
    { label: t("posts"), value: a.counts.posts, icon: Receipt, href: "/admin/blog" as const },
    { label: t("leads"), value: a.counts.leads, icon: Users, href: "/admin/leads" as const },
    { label: t("kpi.newsletter"), value: a.counts.newsletter, icon: Mail, href: "/admin/newsletter" as const },
  ];

  const dateFmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "sr-RS", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-navy mb-2">
          {t("title")}
        </h1>
        <p className="text-gray-600">
          {t("hello", { name: profile.full_name })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${k.accent} opacity-60 pointer-events-none`}
              />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                    {k.label}
                  </span>
                  <Icon className="w-5 h-5 opacity-70" />
                </div>
                <div className="text-2xl font-semibold text-navy">{k.value}</div>
                {k.delta && <div className="mt-2">{k.delta}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart (14 days) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-navy">
                {t("chart.title")}
              </h2>
              <p className="text-xs text-gray-500">{t("chart.subtitle")}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">{t("chart.peak")}</div>
              <div className="text-sm font-semibold text-navy">
                {formatRsd(maxDaily)}
              </div>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-48">
            {a.daily.map((d) => {
              const pct = (d.value / maxDaily) * 100;
              const day = new Date(d.date);
              return (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center justify-end group"
                  title={`${dateFmt.format(day)} — ${formatRsd(d.value)}`}
                >
                  <div className="w-full relative flex items-end h-full">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-teal to-teal/60 transition-all duration-500 group-hover:from-navy group-hover:to-teal"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1.5 truncate">
                    {dateFmt.format(day)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick stats list */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            {t("totals")}
          </h2>
          <div className="space-y-2">
            {sideStats.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.label}
                  href={s.href}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2.5 text-sm text-gray-700">
                    <Icon className="w-4 h-4 text-gray-400" />
                    {s.label}
                  </span>
                  <span className="font-semibold text-navy">{s.value}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            {t("topProducts.title")}
          </h2>
          {a.topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">{t("topProducts.empty")}</p>
          ) : (
            <ol className="space-y-3">
              {a.topProducts.map((p, i) => {
                const max = a.topProducts[0].revenue || 1;
                const pct = (p.revenue / max) * 100;
                return (
                  <li key={p.name + i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-800 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-teal/10 text-teal text-[11px] font-semibold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="text-xs text-gray-500 shrink-0 ml-2">
                        {p.quantity}× · {formatRsd(p.revenue)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal to-navy rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            {t("statuses.title")}
          </h2>
          {a.statusCounts.size === 0 ? (
            <p className="text-sm text-gray-500">{t("statuses.empty")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {[...a.statusCounts.entries()].map(([status, count]) => (
                <span
                  key={status}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {status}
                  <span className="bg-white/70 px-1.5 py-0.5 rounded-full text-[10px]">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-navy">
              {t("recent.title")}
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs text-teal hover:underline"
            >
              {t("recent.viewAll")} →
            </Link>
          </div>
          {a.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">{t("recent.empty")}</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="px-2 py-2 font-medium">#</th>
                    <th className="px-2 py-2 font-medium">{t("recent.customer")}</th>
                    <th className="px-2 py-2 font-medium">{t("recent.status")}</th>
                    <th className="px-2 py-2 font-medium text-right">
                      {t("recent.total")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {a.recentOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-t border-gray-100 hover:bg-gray-50/60"
                    >
                      <td className="px-2 py-2.5">
                        <span className="font-mono text-xs text-gray-700">
                          {o.order_number}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 truncate max-w-[180px]">
                        {o.customer?.name ?? o.customer?.email ?? "—"}
                      </td>
                      <td className="px-2 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right font-semibold text-navy">
                        {formatRsd(o.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            {t("lowStock.title")}
          </h2>
          {a.lowStock.length === 0 ? (
            <p className="text-sm text-gray-500">{t("lowStock.empty")}</p>
          ) : (
            <ul className="space-y-2.5">
              {a.lowStock.map((p) => {
                const name =
                  (locale === "en" ? p.name?.en : p.name?.sr) ||
                  p.name?.sr ||
                  p.name?.en ||
                  "—";
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate text-gray-800">{name}</span>
                    <span
                      className={`shrink-0 ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.stock === 0
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
