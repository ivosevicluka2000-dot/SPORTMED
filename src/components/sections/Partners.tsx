"use client";

import { motion } from "framer-motion";
import Section, { SectionHeader } from "@/components/ui/Section";
import { useTranslations } from "next-intl";

export default function Partners() {
  const t = useTranslations("partners");

  const partners = [
    "Partner 1",
    "Partner 2",
    "Partner 3",
    "Partner 4",
    "Partner 5",
    "Partner 6",
  ];

  return (
    <Section className="bg-ivory">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6"
      >
        {partners.map((partner, index) => (
          <div
            key={partner}
            className="flex items-center justify-center h-12 px-6"
          >
            <span className="text-gray-300 font-medium text-sm tracking-wide">
              {partner}
            </span>
            {index < partners.length - 1 && (
              <div className="hidden lg:block w-px h-5 bg-gray-200 ml-12" />
            )}
          </div>
        ))}
      </motion.div>
    </Section>
  );
}
