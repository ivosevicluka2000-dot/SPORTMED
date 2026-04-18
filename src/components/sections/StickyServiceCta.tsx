"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StickyServiceCta() {
  const t = useTranslations("leadCapture");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 400px
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
        >
          <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3 max-w-lg mx-auto">
              <a
                href="tel:+381600000000"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 bg-navy text-white font-medium py-3 rounded-lg text-sm transition-colors hover:bg-navy-light"
                )}
              >
                <Phone className="w-4 h-4" />
                {t("stickyTitle")}
              </a>
              <Link
                href="/kontakt"
                className="flex-1 flex items-center justify-center gap-2 bg-teal text-white font-medium py-3 rounded-lg text-sm transition-colors hover:bg-teal-dark"
              >
                <Calendar className="w-4 h-4" />
                {t("stickyTitle")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
