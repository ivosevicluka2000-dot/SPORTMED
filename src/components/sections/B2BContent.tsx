"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import Section, { SectionHeader } from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import B2BOutcomes from "@/components/sections/B2BOutcomes";
import B2BRoiCalculator from "@/components/sections/B2BRoiCalculator";
import B2BProposalBuilder from "@/components/sections/B2BProposalBuilder";
import { b2bProductKits, b2bServices } from "@/lib/utils";
import {
  Package,
  Tag,
  Cross,
  Pill,
  Dumbbell,
  HeartPulse,
  MapPinned,
  ShieldCheck,
  BarChart3,
  Building2,
  ArrowRight,
  Tags,
  Boxes,
  Users,
  Handshake,
  Stethoscope,
} from "lucide-react";

const kitIconMap: Record<string, React.ElementType> = {
  Package,
  Tag,
  Cross,
  Pill,
  Dumbbell,
};

const serviceIconMap: Record<string, React.ElementType> = {
  HeartPulse,
  MapPinned,
  ShieldCheck,
  BarChart3,
};

const valueBulletIcons = [Tags, Boxes, Package, Handshake];

export default function B2BContent() {
  const t = useTranslations("b2b");
  const tBullets = useTranslations("b2b.valueBullets");
  const tKitsSection = useTranslations("b2b.kitsSection");
  const tClinic = useTranslations("b2b.clinicBackup");
  const tFinal = useTranslations("b2b.finalCta");

  const valueItems = tBullets.raw("items") as { title: string; description: string }[];

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
            className="text-lg text-white/60 max-w-2xl mx-auto mb-8"
          >
            {t("heroSubtext")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href="/kontakt">
              <Button size="lg" className="w-full sm:w-auto">
                {t("primaryCta")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <a href="#kits">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t("secondaryCta")}
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Value bullets — matches photo mockup */}
      <Section>
        <SectionHeader
          title={tBullets("title")}
          subtitle={tBullets("subtitle")}
          accent
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueItems.map((item, index) => {
            const Icon = valueBulletIcons[index] ?? Tags;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-[var(--shadow-soft)] transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-teal" />
                </div>
                <h3 className="text-sm font-heading font-bold text-navy mb-2 tracking-wider">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Outcome Stats Strip + case studies */}
      <B2BOutcomes />

      {/* Product Kits — primary offer */}
      <Section id="kits">
        <SectionHeader
          title={tKitsSection("title")}
          subtitle={tKitsSection("subtitle")}
          accent
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 rounded-xl overflow-hidden">
          {b2bProductKits.map((kit, index) => {
            const Icon = kitIconMap[kit.icon] ?? Package;
            return (
              <Link
                key={kit.slug}
                href={{ pathname: "/b2b/[slug]", params: { slug: kit.slug } }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-white p-8 group hover:bg-teal-50/30 transition-colors h-full"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center mb-5 group-hover:border-teal transition-colors">
                      <Icon className="w-5 h-5 text-teal" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-navy mb-2">
                    {t(`kits.${kit.slug}.title`)}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-3">
                    {t(`kits.${kit.slug}.shortDescription`)}
                  </p>
                  <p className="text-xs text-teal font-medium mb-3">
                    {t(`kits.${kit.slug}.bulkPricing`)}
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

      {/* Bulk-pricing ROI Calculator */}
      <Section className="bg-ivory">
        <B2BRoiCalculator />
      </Section>

      {/* Proposal / Quote Builder */}
      <Section>
        <B2BProposalBuilder />
      </Section>

      {/* Optional clinic backup — demoted */}
      <Section className="bg-ivory">
        <div className="max-w-4xl mx-auto">
          <div className="border border-gray-200 rounded-2xl p-8 bg-white">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-semibold text-navy mb-2">
                  {tClinic("title")}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {tClinic("subtitle")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {b2bServices.map((service) => {
                const Icon = serviceIconMap[service.icon] ?? HeartPulse;
                return (
                  <Link
                    key={service.slug}
                    href={{ pathname: "/b2b/[slug]", params: { slug: service.slug } }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-teal/30 hover:bg-teal-50/30 transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-teal flex-shrink-0" />
                    <span className="text-sm text-navy font-medium flex-1">
                      {t(`services.${service.slug}.title`)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-teal transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* Client logos */}
      <Section>
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
                Klub {i}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Final CTA band */}
      <section className="bg-navy py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full border border-teal/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-teal" />
            </div>
          </div>
          <h2 className="text-2xl md:text-4xl font-heading font-semibold text-white mb-4">
            {tFinal("title")}
          </h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            {tFinal("subtitle")}
          </p>
          <Link href="/kontakt">
            <Button size="lg">
              {tFinal("button")}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
