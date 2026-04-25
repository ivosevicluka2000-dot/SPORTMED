"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative bg-navy min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="https://images.pexels.com/videos/5319980/free-video-5319980.jpg"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 w-full h-full object-cover motion-reduce:hidden"
      >
        <source
          src="https://videos.pexels.com/video-files/5319980/5319980-uhd_2560_1440_30fps.mp4"
          type="video/mp4"
        />
      </video>

      {/* Static fallback for reduced-motion users */}
      <div
        aria-hidden="true"
        className="hidden motion-reduce:block absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.pexels.com/videos/5319980/free-video-5319980.jpg)",
        }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-navy/70" />

      {/* Subtle gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy/30 via-transparent to-navy/80" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="h-px w-8 bg-gold" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Sport Care Med
          </span>
          <div className="h-px w-8 bg-gold" />
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
          className="text-base md:text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <Link href="/prodavnica">
            <Button size="lg">
              {t("cta")}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link
            href="/alati"
            className="group inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            {t("learnMore")}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      {/* Bottom edge accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/20 to-transparent" />
    </section>
  );
}
