"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CheckCircle, ShoppingBag, Home } from "lucide-react";

export default function ConfirmationPage() {
  const t = useTranslations("shop");
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-16 h-16 rounded-full border border-green-200 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-navy mb-4 tracking-tight">
          {t("orderConfirmed")}
        </h1>
        {orderNumber && (
          <p className="text-sm text-gray-400 mb-2">
            {t("orderNumber")}: <strong className="text-navy">{orderNumber}</strong>
          </p>
        )}
        <p className="text-gray-500 mb-10">{t("orderConfirmedDescription")}</p>

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
