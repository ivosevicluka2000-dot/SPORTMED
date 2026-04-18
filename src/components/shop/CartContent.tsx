"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useDiscount } from "@/lib/discount-context";
import CartItemRow from "./CartItemRow";

const FREE_SHIPPING_THRESHOLD = 5000;
const SHIPPING_COST = 500;

export default function CartContent() {
  const t = useTranslations("shop");
  const { items, total, clearCart } = useCart();
  const { discountCode, discountPercent, isActive } = useDiscount();

  const discountAmount = isActive ? Math.round(total * (discountPercent / 100)) : 0;
  const subtotalAfterDiscount = total - discountAmount;
  const shippingCost = subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const grandTotal = subtotalAfterDiscount + shippingCost;

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-5" />
        <h2 className="text-xl font-heading font-semibold text-navy mb-2">
          {t("emptyCart")}
        </h2>
        <p className="text-gray-400 mb-8 text-sm">{t("emptyCartDescription")}</p>
        <Link
          href="/prodavnica"
          className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-md font-medium tracking-wide hover:bg-navy/90 transition-colors"
        >
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart items */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-heading font-semibold text-navy">
            {t("cartItems", { count: items.length })}
          </h2>
          <button
            onClick={clearCart}
            className="text-xs uppercase tracking-wider text-red-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            {t("clearCart")}
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6">
          {items.map((item) => (
            <CartItemRow key={item.productId} item={item} />
          ))}
        </div>
      </div>

      {/* Order summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
          <h3 className="text-sm font-heading font-semibold text-navy mb-5 uppercase tracking-wider">
            {t("orderSummary")}
          </h3>

          {isActive && discountCode && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg text-green-700 text-sm">
              <Tag className="w-4 h-4 flex-shrink-0" />
              {t("discountApplied", { code: discountCode, percent: discountPercent })}
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">{t("subtotal")}</span>
              <span className="text-navy font-medium">
                {total.toLocaleString("sr-RS")} RSD
              </span>
            </div>
            {isActive && discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{t("discountLabel", { percent: discountPercent })}</span>
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
            {shippingCost > 0 && (
              <p className="text-xs text-teal">
                {t("freeShippingThreshold", {
                  amount: FREE_SHIPPING_THRESHOLD.toLocaleString("sr-RS"),
                })}
              </p>
            )}
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between text-base">
              <span className="font-heading font-semibold text-navy">{t("total")}</span>
              <span className="font-heading font-semibold text-navy">
                {grandTotal.toLocaleString("sr-RS")} RSD
              </span>
            </div>
          </div>

          <Link
            href="/prodavnica/checkout"
            className="mt-6 w-full flex items-center justify-center gap-2 bg-navy text-white py-3 px-6 rounded-md font-medium tracking-wide hover:bg-navy/90 transition-colors"
          >
            {t("proceedToCheckout")}
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/prodavnica"
            className="mt-3 w-full flex items-center justify-center text-xs uppercase tracking-wider text-gray-400 hover:text-teal transition-colors"
          >
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </div>
  );
}
