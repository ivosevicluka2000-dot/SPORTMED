"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Section from "@/components/ui/Section";
import { MapPin, Clock, Car, Navigation } from "lucide-react";

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

      {/* Clinic photos placeholder */}
      <Section className="bg-ivory">
        <h2 className="text-2xl font-heading font-semibold text-navy text-center mb-10">
          {t("facilityLabel")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square bg-white border border-gray-100 rounded-lg flex items-center justify-center"
            >
              <span className="text-gray-300 text-xs uppercase tracking-wider">
                Photo {i}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
