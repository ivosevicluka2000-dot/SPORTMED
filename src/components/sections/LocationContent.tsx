"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Section from "@/components/ui/Section";
import { Link } from "@/i18n/routing";
import { MapPin, Clock, Car, Navigation, Phone, Send, Image as ImageIcon } from "lucide-react";

export default function LocationContent() {
  const t = useTranslations("location");

  return (
    <>
      {/* Hero */}
      <section className="bg-navy py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <span className="h-px w-8 bg-gold" />
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium">
              Sport Care Med
            </span>
            <span className="h-px w-8 bg-gold" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold text-white mb-5"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60"
          >
            {t("subtitle")}
          </motion.p>
        </div>
      </section>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border border-gray-100 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-navy mb-1">
                    {t("address")}
                  </h3>
                  <p className="text-gray-500 text-sm">Šabac, Srbija</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border border-gray-100 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-navy mb-3">
                    {t("workingHours")}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-400">{t("weekdays")}</span>
                      <span className="text-navy font-medium">08:00 - 20:00</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-400">{t("saturday")}</span>
                      <span className="text-navy font-medium">09:00 - 14:00</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-400">{t("sunday")}</span>
                      <span className="text-red-400 font-medium">
                        {t("closed")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border border-gray-100 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center flex-shrink-0">
                  <Car className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-navy mb-1">
                    {t("parking")}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {t("parkingNote")}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="border border-gray-100 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-navy mb-1">
                    {t("directions")}
                  </h3>
                  <a
                    href="https://maps.google.com/?q=Šabac+Srbija"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal hover:text-teal-dark text-sm font-medium inline-flex items-center gap-1"
                  >
                    Google Maps
                    <span className="text-xs">→</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl overflow-hidden border border-gray-100 h-[500px] lg:h-auto"
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

      {/* Clinic gallery */}
      <Section className="bg-ivory">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold text-navy mb-4">
            {t("galleryTitle")}
          </h2>
          <p className="text-gray-500">{t("gallerySubtitle")}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { i: 1, span: "md:col-span-2 md:row-span-2 aspect-square md:aspect-auto" },
            { i: 2, span: "aspect-square" },
            { i: 3, span: "aspect-square" },
            { i: 4, span: "aspect-square" },
            { i: 5, span: "aspect-square" },
            { i: 6, span: "aspect-square" },
          ].map(({ i, span }) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-navy/5 via-teal/10 to-navy/10 border border-gray-100 ${span}`}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center text-teal/30">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">
                  {t("facilityLabel")} {i}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-navy">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-heading font-semibold text-white mb-4"
          >
            {t("ctaTitle")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/60 mb-8"
          >
            {t("ctaSubtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a
              href="tel:+381691982215"
              className="inline-flex items-center justify-center gap-2 bg-teal text-white font-medium px-7 py-3.5 rounded-lg hover:bg-teal-dark transition-colors w-full sm:w-auto"
            >
              <Phone className="w-4 h-4" />
              {t("ctaCall")}
            </a>
            <Link
              href="/kontakt"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-medium px-7 py-3.5 rounded-lg hover:bg-white/15 transition-colors border border-white/20 w-full sm:w-auto"
            >
              <Send className="w-4 h-4" />
              {t("ctaContact")}
            </Link>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
