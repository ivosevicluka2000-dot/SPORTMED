"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import Section, { SectionHeader } from "@/components/ui/Section";
import B2BOutcomes from "@/components/sections/B2BOutcomes";
import B2BRoiCalculator from "@/components/sections/B2BRoiCalculator";
import B2BProposalBuilder from "@/components/sections/B2BProposalBuilder";
import {
  HeartPulse,
  MapPinned,
  ShieldCheck,
  BarChart3,
  Building2,
  ArrowRight,
} from "lucide-react";

const packageIcons = [HeartPulse, MapPinned, ShieldCheck, BarChart3];

const packageKeys = [
  "rehabilitation",
  "onsite",
  "prevention",
  "testing",
] as const;

const packageSlugs = [
  "timska-rehabilitacija",
  "fizioterapija-na-terenu",
  "prevencija-povreda",
  "testiranje-performansi",
] as const;

export default function B2BContent() {
  const t = useTranslations("b2b");

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
            <div className="w-8 h-8 rounded-full border border-teal/30 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-teal" />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium">
              {t("title")}
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold text-white mb-5"
          >
            {t("subtitle")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xl md:text-2xl text-teal font-heading font-medium max-w-3xl mx-auto mb-4"
          >
            {t("heroText")}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            {t("heroSubtext")}
          </motion.p>
        </div>
      </section>

      {/* Outcome Stats Strip */}
      <B2BOutcomes />

      {/* Service Packages — linked to sub-pages */}
      <Section>
        <SectionHeader
          title={t("packages.title")}
          subtitle={t("packages.subtitle")}
          accent
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200 rounded-xl overflow-hidden">
          {packageKeys.map((key, index) => {
            const Icon = packageIcons[index];
            const slug = packageSlugs[index];
            return (
              <Link
                key={key}
                href={{ pathname: "/b2b/[slug]", params: { slug } }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-8 group hover:bg-teal-50/30 transition-colors h-full"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center mb-5 group-hover:border-teal transition-colors">
                      <Icon className="w-5 h-5 text-teal" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-navy mb-2">
                    {t(`packages.${key}.title`)}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-3">
                    {t(`packages.${key}.description`)}
                  </p>
                  <span className="text-teal text-sm font-medium">
                    {t("learnMore")} →
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* ROI Calculator */}
      <Section className="bg-ivory">
        <B2BRoiCalculator />
      </Section>

      {/* Proposal Builder */}
      <Section>
        <B2BProposalBuilder />
      </Section>

      {/* Client logos placeholder */}
      <Section className="bg-ivory">
        <SectionHeader
          title={t("clients.title")}
          subtitle={t("clients.subtitle")}
          accent
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-lg border border-gray-100 flex items-center justify-center"
            >
              <span className="text-gray-300 text-xs uppercase tracking-wider">
                Client {i}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
