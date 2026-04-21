"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Banknote, Loader2, Tag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useDiscount } from "@/lib/discount-context";
import CartItemRow from "./CartItemRow";

const FREE_SHIPPING_THRESHOLD = 5000;
const SHIPPING_COST = 500;

const checkoutSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(4),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutForm() {
  const t = useTranslations("shop");
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { discountCode, discountPercent, isActive } = useDiscount();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discountAmount = isActive ? Math.round(total * (discountPercent / 100)) : 0;
  const subtotalAfterDiscount = total - discountAmount;
  const shippingCost = subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const grandTotal = subtotalAfterDiscount + shippingCost;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const orderItems = items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      if (paymentMethod === "card") {
        // Create RaiAccept payment session
        const res = await fetch("/api/raiaccept/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: orderItems,
            customer: data,
            shippingCost,
            discountCode: isActive ? discountCode : undefined,
            locale: document.documentElement.lang || "sr",
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Payment failed");
        }

        const { paymentUrl } = await res.json();

        // Persist pending order ref so confirmation page can clear cart on return
        try {
          sessionStorage.setItem("scm-pending-order", "1");
        } catch {
          // ignore
        }

        // Redirect to RaiAccept hosted payment form
        window.location.href = paymentUrl;
        return;
      } else {
        // Cash on delivery
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: orderItems,
            customer: data,
            paymentMethod: "cod",
            shippingCost,
            discountCode: isActive ? discountCode : undefined,
            locale: document.documentElement.lang || "sr",
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Order failed");
        }

        const { orderNumber } = await res.json();
        clearCart();
        router.push(
          `/prodavnica/potvrda?order=${orderNumber}` as "/prodavnica/potvrda"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Shipping info + Payment */}
      <div className="lg:col-span-2 space-y-8">
        {/* Shipping info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
          <h2 className="text-sm font-heading font-semibold text-navy mb-5 uppercase tracking-wider">
            {t("shippingInfo")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                {t("fullName")} *
              </label>
              <input
                {...register("name")}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 focus:border-teal focus:ring-1 focus:ring-teal/20 outline-none transition-colors"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{t("required")}</p>
              )}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                {t("emailLabel")} *
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 focus:border-teal focus:ring-1 focus:ring-teal/20 outline-none transition-colors"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{t("invalidEmail")}</p>
              )}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                {t("phoneLabel")} *
              </label>
              <input
                type="tel"
                {...register("phone")}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 focus:border-teal focus:ring-1 focus:ring-teal/20 outline-none transition-colors"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{t("required")}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                {t("address")} *
              </label>
              <input
                {...register("address")}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 focus:border-teal focus:ring-1 focus:ring-teal/20 outline-none transition-colors"
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{t("required")}</p>
              )}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                {t("city")} *
              </label>
              <input
                {...register("city")}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 focus:border-teal focus:ring-1 focus:ring-teal/20 outline-none transition-colors"
              />
              {errors.city && (
                <p className="text-red-500 text-xs mt-1">{t("required")}</p>
              )}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                {t("postalCode")} *
              </label>
              <input
                {...register("postalCode")}
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 focus:border-teal focus:ring-1 focus:ring-teal/20 outline-none transition-colors"
              />
              {errors.postalCode && (
                <p className="text-red-500 text-xs mt-1">{t("required")}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8">
          <h2 className="text-sm font-heading font-semibold text-navy mb-5 uppercase tracking-wider">
            {t("paymentMethod")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod("cod")}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                paymentMethod === "cod"
                  ? "border-navy bg-navy/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Banknote className="w-5 h-5 text-teal" />
              <div className="text-left">
                <p className="font-medium text-navy text-sm">{t("cashOnDelivery")}</p>
                <p className="text-xs text-gray-400">{t("codDescription")}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                paymentMethod === "card"
                  ? "border-navy bg-navy/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <CreditCard className="w-5 h-5 text-teal" />
              <div className="text-left">
                <p className="font-medium text-navy text-sm">{t("cardPayment")}</p>
                <p className="text-xs text-gray-400">{t("cardDescription")}</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Order summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
          <h3 className="text-sm font-heading font-semibold text-navy mb-5 uppercase tracking-wider">
            {t("orderSummary")}
          </h3>

          {/* Items */}
          <div className="max-h-64 overflow-y-auto mb-4">
            {items.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </div>

          <div className="space-y-3 text-sm border-t border-gray-100 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-400">{t("subtotal")}</span>
              <span className="text-navy font-medium">
                {total.toLocaleString("sr-RS")} RSD
              </span>
            </div>
            {isActive && discountAmount > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <Tag className="w-3 h-3" />
                <span className="flex-1">{t("discountLabel", { percent: discountPercent })}</span>
                <span className="font-medium">
                  -{discountAmount.toLocaleString("sr-RS")} RSD
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">{t("shipping")}</span>
              <span className="text-navy font-medium">
                {shippingCost === 0
                  ? t("freeShipping")
                  : `${shippingCost.toLocaleString("sr-RS")} RSD`}
              </span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between text-base">
              <span className="font-heading font-semibold text-navy">{t("total")}</span>
              <span className="font-heading font-semibold text-navy">
                {grandTotal.toLocaleString("sr-RS")} RSD
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-navy text-white py-3 px-6 rounded-md font-medium tracking-wide hover:bg-navy/90 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("processing")}
              </>
            ) : paymentMethod === "card" ? (
              t("payNow")
            ) : (
              t("placeOrder")
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
