import { useTranslations } from "next-intl";

// Single source of truth for the order-status palette. Used by the badge
// component below and by the colored status buttons on the admin order
// detail page. Keep solid + outline variants in sync per status.
export const STATUS_COLORS: Record<
  string,
  { solid: string; outline: string; dot: string }
> = {
  pending: {
    solid: "bg-amber-500 text-white ring-amber-500 hover:bg-amber-600",
    outline:
      "bg-amber-50 text-amber-800 ring-amber-300 hover:bg-amber-100",
    dot: "bg-amber-500",
  },
  awaiting_payment: {
    solid: "bg-yellow-500 text-white ring-yellow-500 hover:bg-yellow-600",
    outline:
      "bg-yellow-50 text-yellow-800 ring-yellow-300 hover:bg-yellow-100",
    dot: "bg-yellow-500",
  },
  confirmed: {
    solid:
      "bg-emerald-600 text-white ring-emerald-600 hover:bg-emerald-700",
    outline:
      "bg-emerald-50 text-emerald-800 ring-emerald-300 hover:bg-emerald-100",
    dot: "bg-emerald-600",
  },
  paid: {
    solid: "bg-green-700 text-white ring-green-700 hover:bg-green-800",
    outline:
      "bg-green-50 text-green-800 ring-green-300 hover:bg-green-100",
    dot: "bg-green-700",
  },
  processing: {
    solid: "bg-blue-600 text-white ring-blue-600 hover:bg-blue-700",
    outline:
      "bg-blue-50 text-blue-800 ring-blue-300 hover:bg-blue-100",
    dot: "bg-blue-600",
  },
  shipped: {
    solid: "bg-violet-600 text-white ring-violet-600 hover:bg-violet-700",
    outline:
      "bg-violet-50 text-violet-800 ring-violet-300 hover:bg-violet-100",
    dot: "bg-violet-600",
  },
  delivered: {
    solid: "bg-teal-600 text-white ring-teal-600 hover:bg-teal-700",
    outline:
      "bg-teal-50 text-teal-800 ring-teal-300 hover:bg-teal-100",
    dot: "bg-teal-600",
  },
  cancelled: {
    solid: "bg-red-600 text-white ring-red-600 hover:bg-red-700",
    outline: "bg-red-50 text-red-800 ring-red-300 hover:bg-red-100",
    dot: "bg-red-600",
  },
  failed: {
    solid: "bg-rose-700 text-white ring-rose-700 hover:bg-rose-800",
    outline:
      "bg-rose-50 text-rose-800 ring-rose-300 hover:bg-rose-100",
    dot: "bg-rose-700",
  },
};

const FALLBACK_OUTLINE = "bg-gray-100 text-gray-800 ring-gray-300";

export function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations("account.order.status");
  const cls = STATUS_COLORS[status]?.outline ?? FALLBACK_OUTLINE;
  const label = status in STATUS_COLORS ? t(status as never) : status;
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
  const cls = (key && PAYMENT_STYLES[key]) || FALLBACK_OUTLINE;
  const label = key ? t(key as never) : method || "—";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}
