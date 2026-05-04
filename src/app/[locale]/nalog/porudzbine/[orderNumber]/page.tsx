import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getPathname, type Locale } from "@/i18n/routing";
import { ChevronLeft } from "lucide-react";

interface OrderItem {
  product_id?: string;
  product_name: string;
  quantity: number;
  price: number;
}
interface OrderRecord {
  order_number: string;
  status: string;
  payment_method: string;
  subtotal: number;
  discount_code: string | null;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  items: OrderItem[];
  created_at: string;
}

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    redirect(getPathname({ locale: locale as Locale, href: "/nalog/prijava" }));
  }
  const t = await getTranslations({ locale, namespace: "account" });

  const { data } = await supabase
    .from("orders")
    .select(
      "order_number, status, payment_method, subtotal, discount_code, discount_amount, shipping_cost, total_amount, customer, items, created_at"
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  const order = data as OrderRecord | null;
  if (!order) notFound();

  const moneyFmt = new Intl.NumberFormat(locale === "sr" ? "sr-RS" : "en-GB");
  const fmt = (n: number) => `${moneyFmt.format(n)} RSD`;

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/nalog"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> {t("order.backToOrders")}
        </Link>

        <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-navy mb-2 tracking-tight">
          {t("order.title", { number: order.order_number })}
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          {t("dashboard.orderStatus")}:{" "}
          <span className="text-navy">
            {t(`status.${order.status as "pending"}`)}
          </span>
        </p>

        <div className="border border-gray-200 rounded-lg p-6 sm:p-8 mb-6">
          <h2 className="font-heading text-lg text-navy mb-4">
            {t("order.items")}
          </h2>
          <ul className="divide-y divide-gray-100">
            {order.items.map((item, i) => (
              <li key={i} className="py-3 flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="text-navy">{fmt(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">{t("order.subtotal")}</dt>
              <dd className="text-gray-700">{fmt(order.subtotal)}</dd>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">
                  {t("order.discount")}
                  {order.discount_code ? ` (${order.discount_code})` : ""}
                </dt>
                <dd className="text-gray-700">−{fmt(order.discount_amount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">{t("order.shipping")}</dt>
              <dd className="text-gray-700">{fmt(order.shipping_cost)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
              <dt className="font-medium text-navy">{t("order.total")}</dt>
              <dd className="font-medium text-navy">{fmt(order.total_amount)}</dd>
            </div>
          </dl>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 sm:p-8">
          <h2 className="font-heading text-lg text-navy mb-4">
            {t("order.customer")}
          </h2>
          <address className="not-italic text-sm text-gray-700 leading-relaxed">
            {order.customer.name}
            <br />
            {order.customer.address}
            <br />
            {order.customer.postal_code} {order.customer.city}
            <br />
            {order.customer.phone} · {order.customer.email}
          </address>
        </div>
      </div>
    </section>
  );
}
