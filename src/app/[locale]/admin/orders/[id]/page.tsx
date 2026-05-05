import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateOrderStatusAction } from "../_actions";
import {
  OrderStatusBadge,
  PaymentMethodBadge,
  STATUS_COLORS,
} from "@/components/admin/OrderStatusBadge";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const COD_STATUSES = ["pending", "processing", "paid", "cancelled"] as const;

const CARD_STATUSES = [
  "pending",
  "awaiting_payment",
  "confirmed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
] as const;

interface OrderItem {
  product_id?: string;
  product_name?: string;
  quantity: number;
  price: number;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const t = await getTranslations("admin");
  const tStatus = await getTranslations("account.order");
  const admin = createAdminClient();
  const { data } = await admin.from("orders").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const items: OrderItem[] = Array.isArray(data.items) ? data.items : [];
  const customer = (data.customer ?? {}) as Record<string, string | undefined>;
  const paymentMethod = (data.payment_method ?? "") as string;
  const statusOptions =
    paymentMethod === "cod" ? COD_STATUSES : CARD_STATUSES;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-navy">
          {t("orders.editTitle")} — {data.order_number}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date(data.created_at).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-navy mb-3">{t("orders.customer")}</h2>
          <dl className="text-sm space-y-1">
            <div>
              <dt className="inline text-gray-500">Name: </dt>
              <dd className="inline text-navy">{customer.name ?? ""}</dd>
            </div>
            <div>
              <dt className="inline text-gray-500">Email: </dt>
              <dd className="inline text-navy">{customer.email ?? ""}</dd>
            </div>
            {customer.phone && (
              <div>
                <dt className="inline text-gray-500">Phone: </dt>
                <dd className="inline text-navy">{customer.phone}</dd>
              </div>
            )}
            {customer.address && (
              <div>
                <dt className="inline text-gray-500">Address: </dt>
                <dd className="inline text-navy">
                  {customer.address}, {customer.city} {customer.postal_code}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-navy mb-3">{t("orders.status")}</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-500">{t("orders.current")}:</span>
            <OrderStatusBadge status={data.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => {
              const isActive = s === data.status;
              const palette = STATUS_COLORS[s];
              const cls = isActive ? palette.solid : palette.outline;
              return (
                <form key={s} action={updateOrderStatusAction}>
                  <input type="hidden" name="id" value={data.id} />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="status" value={s} />
                  <button
                    type="submit"
                    disabled={isActive}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ring-1 ring-inset transition-colors cursor-pointer disabled:cursor-default ${cls}`}
                  >
                    {!isActive && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${palette.dot}`}
                        aria-hidden
                      />
                    )}
                    {tStatus(`status.${s}`)}
                  </button>
                </form>
              );
            })}
          </div>
          <dl className="text-sm space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <dt className="text-gray-500">{t("orders.payment")}:</dt>
              <dd>
                <PaymentMethodBadge method={paymentMethod} />
              </dd>
            </div>
            <div>
              <dt className="inline text-gray-500">Total: </dt>
              <dd className="inline text-navy">
                {Number(data.total_amount).toLocaleString("sr-RS")} RSD
              </dd>
            </div>
            {data.discount_code && (
              <div>
                <dt className="inline text-gray-500">Discount: </dt>
                <dd className="inline text-navy">
                  {data.discount_code} (−
                  {Number(data.discount_amount).toLocaleString("sr-RS")} RSD)
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-navy mb-3">{t("orders.items")}</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 text-xs uppercase">
            <tr>
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="py-2">{it.product_name ?? it.product_id}</td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right">
                  {it.price.toLocaleString("sr-RS")} RSD
                </td>
                <td className="py-2 text-right">
                  {(it.price * it.quantity).toLocaleString("sr-RS")} RSD
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
