"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Section, { SectionHeader } from "@/components/ui/Section";
import { Users, Monitor, UserCheck, Trophy } from "lucide-react";

const icons = [
  <Users key="u" className="w-5 h-5" />,
  <Monitor key="m" className="w-5 h-5" />,
  <UserCheck key="uc" className="w-5 h-5" />,
  <Trophy key="t" className="w-5 h-5" />,
];

const keys = ["expertise", "equipment", "individual", "results"] as const;

export default function WhyUs() {
  const t = useTranslations("whyUs");

  return (
    <Section className="bg-ivory">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} accent />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
        {keys.map((key, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="flex gap-5"
          >
            <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-teal flex-shrink-0 mt-0.5">
              {icons[index]}
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-navy mb-1.5">
                {t(`items.${key}.title`)}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {t(`items.${key}.description`)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
