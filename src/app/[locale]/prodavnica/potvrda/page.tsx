import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CheckCircle, ShoppingBag, Home, AlertTriangle, Clock } from "lucide-react";
import { client } from "@/lib/sanity";
import ClearCartOnConfirmation from "@/components/shop/ClearCartOnConfirmation";

export const dynamic = "force-dynamic";

interface OrderRecord {
  orderNumber: string;
  status?: string;
  totalAmount?: number;
  paymentMethod?: string;
}

async function fetchOrder(orderNumber: string): Promise<OrderRecord | null> {
  if (!orderNumber || !/^[A-Z0-9_-]{3,40}$/i.test(orderNumber)) return null;
  if (!client) return null;
  try {
    const result = await client.fetch<OrderRecord | null>(
      `*[_type == "order" && orderNumber == $on][0]{ orderNumber, status, totalAmount, paymentMethod }`,
      { on: orderNumber }
    );
    return result ?? null;
  } catch {
    return null;
  }
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  const t = await getTranslations("shop");

  const orderRecord = orderNumber ? await fetchOrder(orderNumber) : null;
  const status = orderRecord?.status ?? "unknown";

  // If Sanity is not configured (dev), fall back to optimistic success when an order param is present
  const sanityUnavailable = !client && Boolean(orderNumber);

  // Show success only when payment is completed OR pending COD (cash on delivery)
  const isSuccess =
    sanityUnavailable ||
    (orderRecord != null &&
      (status === "paid" ||
        status === "completed" ||
        status === "processing" ||
        (orderRecord.paymentMethod === "cod" && status !== "failed" && status !== "cancelled")));
  const isPending = orderRecord != null && (status === "pending" || status === "awaiting_payment");
  const isFailed = !sanityUnavailable && (!orderRecord || status === "failed" || status === "cancelled");

  return (
    <section className="py-20 md:py-28">
      <ClearCartOnConfirmation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {isSuccess && (
          <>
            <div className="w-16 h-16 rounded-full border border-green-200 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-navy mb-4 tracking-tight">
              {t("orderConfirmed")}
            </h1>
            {orderRecord?.orderNumber && (
              <p className="text-sm text-gray-400 mb-2">
                {t("orderNumber")}:{" "}
                <strong className="text-navy">{orderRecord.orderNumber}</strong>
              </p>
            )}
            <p className="text-gray-500 mb-10">{t("orderConfirmedDescription")}</p>
          </>
        )}

        {isPending && !isSuccess && (
          <>
            <div className="w-16 h-16 rounded-full border border-amber-200 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-navy mb-4 tracking-tight">
              {t("orderPending")}
            </h1>
            {orderRecord?.orderNumber && (
              <p className="text-sm text-gray-400 mb-2">
                {t("orderNumber")}:{" "}
                <strong className="text-navy">{orderRecord.orderNumber}</strong>
              </p>
            )}
            <p className="text-gray-500 mb-10">{t("orderPendingDescription")}</p>
          </>
        )}

        {isFailed && !isSuccess && !isPending && (
          <>
            <div className="w-16 h-16 rounded-full border border-red-200 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-navy mb-4 tracking-tight">
              {t("orderNotFound")}
            </h1>
            <p className="text-gray-500 mb-10">{t("orderNotFoundDescription")}</p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/prodavnica"
            className="inline-flex items-center justify-center gap-2 bg-navy text-white px-6 py-3 rounded-md text-sm font-medium tracking-wide hover:bg-navy/90 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {t("continueShopping")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-6 py-3 rounded-md text-sm font-medium tracking-wide hover:border-gray-300 transition-colors"
          >
            <Home className="w-4 h-4" />
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </section>
  );
}
