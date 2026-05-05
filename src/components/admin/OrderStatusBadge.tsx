import { useTranslations } from "next-intl";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 ring-amber-200",
  awaiting_payment: "bg-amber-100 text-amber-800 ring-amber-200",
  confirmed: "bg-sky-100 text-sky-800 ring-sky-200",
  processing: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  shipped: "bg-violet-100 text-violet-800 ring-violet-200",
  paid: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  delivered: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 ring-rose-200",
  failed: "bg-rose-100 text-rose-800 ring-rose-200",
};

const FALLBACK = "bg-gray-100 text-gray-800 ring-gray-200";

export function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations("account.order.status");
  const cls = STATUS_STYLES[status] ?? FALLBACK;
  const label = status in STATUS_STYLES ? t(status as never) : status;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}

const PAYMENT_STYLES: Record<string, string> = {
  card: "bg-blue-100 text-blue-800 ring-blue-200",
  cod: "bg-orange-100 text-orange-800 ring-orange-200",
};

export function PaymentMethodBadge({ method }: { method: string }) {
  const t = useTranslations("admin.orders.paymentMethod");
  const key = method === "card" || method === "cod" ? method : null;
  const cls = (key && PAYMENT_STYLES[key]) || FALLBACK;
  const label = key ? t(key as never) : method || "—";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}
