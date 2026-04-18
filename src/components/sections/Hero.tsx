"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative bg-navy min-h-[90vh] flex items-center overflow-hidden">
      {/* Subtle dot grid pattern */}
      <div className="absolute inset-0 bg-dot-pattern" />

      {/* Subtle gradient wash — restrained, not blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal/[0.03] via-transparent to-navy-dark/50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-0 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Text content — 3/5 */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="h-px w-8 bg-gold" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                Sport Care Med
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.1] mb-8"
            >
              {t("title")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-base md:text-lg text-gray-400 mb-10 max-w-xl leading-relaxed"
            >
              {t("subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-5"
            >
              <Link href="/kontakt">
                <Button size="lg">
                  {t("cta")}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link
                href="/usluge"
                className="group inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                {t("learnMore")}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Image placeholder — 2/5 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-2 hidden lg:block"
          >
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-navy-light border border-white/5">
              {/* Placeholder — replace with clinic image */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10">
                <div className="w-16 h-16 rounded-full border-2 border-current flex items-center justify-center mb-4">
                  <span className="font-heading text-2xl">S</span>
                </div>
                <span className="text-xs uppercase tracking-widest">Clinic Photo</span>
              </div>
              {/* Subtle accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom edge accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/20 to-transparent" />
    </section>
  );
}
