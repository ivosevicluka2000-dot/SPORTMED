"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import Section, { SectionHeader } from "@/components/ui/Section";
import { treatments } from "@/lib/utils";
import {
  Zap,
  Hand,
  Dumbbell,
  Stethoscope,
  HeartPulse,
  Sparkles,
  Snowflake,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5" />,
  Hand: <Hand className="w-5 h-5" />,
  Dumbbell: <Dumbbell className="w-5 h-5" />,
  Stethoscope: <Stethoscope className="w-5 h-5" />,
  HeartPulse: <HeartPulse className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Snowflake: <Snowflake className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
};

export default function ServicesOverview() {
  const t = useTranslations("services");

  return (
    <Section>
      <SectionHeader title={t("title")} subtitle={t("subtitle")} label={t("label")} accent />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
        {treatments.map((treatment, index) => (
          <motion.div
            key={treatment.slug}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
          >
            <Link href={{ pathname: "/usluge/[slug]", params: { slug: treatment.slug } }}>
              <div className="group bg-white p-6 md:p-8 h-full cursor-pointer hover:bg-ivory transition-colors">
                <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-teal mb-5 group-hover:border-teal/30 transition-colors">
                  {iconMap[treatment.icon]}
                </div>
                <h3 className="font-heading text-base font-semibold text-navy mb-2">
                  {t(`items.${treatment.slug}.title`)}
                </h3>
                <p className="text-sm text-gray-400 mb-5 line-clamp-3 leading-relaxed">
                  {t(`items.${treatment.slug}.shortDescription`)}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal uppercase tracking-wider group-hover:gap-2.5 transition-all">
                  {t("learnMore")}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
