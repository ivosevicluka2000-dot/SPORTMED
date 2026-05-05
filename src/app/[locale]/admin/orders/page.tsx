import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  OrderStatusBadge,
  PaymentMethodBadge,
} from "@/components/admin/OrderStatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select(
      "id, order_number, customer, total_amount, status, payment_method, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  type Row = {
    id: string;
    order_number: string;
    customer: { name?: string; email?: string } | null;
    total_amount: number;
    status: string;
    payment_method: string | null;
    created_at: string;
  };
  const rows = (data as Row[]) ?? [];
  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-navy mb-6">
        {t("orders.title")}
      </h1>
      {rows.length === 0 ? (
        <p className="text-gray-500">{t("orders.empty")}</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">{t("orders.orderNumber")}</th>
                <th className="text-left px-4 py-3">{t("orders.customer")}</th>
                <th className="text-left px-4 py-3">{t("orders.payment")}</th>
                <th className="text-right px-4 py-3">{t("orders.total")}</th>
                <th className="text-left px-4 py-3">{t("orders.status")}</th>
                <th className="text-left px-4 py-3">{t("orders.date")}</th>
                <th className="text-right px-4 py-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono text-navy">
                    {o.order_number}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-navy">{o.customer?.name ?? ""}</div>
                    <div className="text-xs text-gray-500">{o.customer?.email ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <PaymentMethodBadge method={o.payment_method ?? ""} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {o.total_amount.toLocaleString("sr-RS")} RSD
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={{ pathname: "/admin/orders/[id]", params: { id: o.id } }}
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
