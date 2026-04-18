"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Section from "@/components/ui/Section";
import { MapPin, ArrowRight, Clock } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function LocationPreview() {
  const t = useTranslations("location");

  return (
    <Section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-8 bg-gold" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-teal">
              {t("title")}
            </span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-navy mb-8">
            {t("subtitle")}
          </h2>

          <div className="space-y-5 mb-10">
            <div className="flex items-start gap-4">
              <MapPin className="w-4 h-4 text-teal mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-navy">{t("address")}</p>
                <p className="text-sm text-gray-400">Šabac, Srbija</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-4 h-4 text-teal mt-1 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-navy">{t("workingHours")}</p>
                <p className="text-sm text-gray-400">{t("weekdays")}: 08:00 - 20:00</p>
                <p className="text-sm text-gray-400">{t("saturday")}: 09:00 - 14:00</p>
                <p className="text-sm text-gray-400">{t("sunday")}: {t("closed")}</p>
              </div>
            </div>
          </div>

          <Link
            href="/lokacija"
            className="group inline-flex items-center gap-2 text-sm font-medium text-teal hover:text-teal-dark transition-colors"
          >
            {t("directions")}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-xl overflow-hidden h-[400px] border border-gray-100"
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d45129.32548803!2d19.67!3d44.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x475bca7d728e8dad%3A0xa3d1e92b80a3e4e0!2z0KjQsNCx0LDRhg!5e0!3m2!1ssr!2srs!4v1"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Sport Care Med location"
          />
        </motion.div>
      </div>
    </Section>
  );
}
