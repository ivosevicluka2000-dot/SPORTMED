"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CartToast() {
  const t = useTranslations("shop");
  const { lastAdded, dismissLastAdded } = useCart();

  useEffect(() => {
    if (!lastAdded) return;
    const id = setTimeout(() => dismissLastAdded(), 4000);
    return () => clearTimeout(id);
  }, [lastAdded, dismissLastAdded]);

  return (
    <div
      className="fixed top-24 right-4 sm:right-6 z-[60] pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {lastAdded && (
          <motion.div
            key={lastAdded.key}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] border border-gray-100 p-4 w-[20rem] max-w-[calc(100vw-2rem)]"
            role="status"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-green-600 uppercase tracking-wider">
                  {t("addedToCart")}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {lastAdded.item.image ? (
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-ivory flex-shrink-0">
                      <Image
                        src={lastAdded.item.image}
                        alt={lastAdded.item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-ivory flex items-center justify-center text-gray-300 flex-shrink-0">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                  )}
                  <p className="text-sm font-medium text-navy line-clamp-2">
                    {lastAdded.item.name}
                  </p>
                </div>
                <Link
                  href="/prodavnica/korpa"
                  onClick={dismissLastAdded}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:text-teal-dark transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {t("viewCart")}
                </Link>
              </div>
              <button
                type="button"
                onClick={dismissLastAdded}
                aria-label={t("dismiss")}
                className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
