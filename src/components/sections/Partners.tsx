"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Section, { SectionHeader } from "@/components/ui/Section";
import { useTranslations } from "next-intl";

type Partner = {
  name: string;
  logo: string;
  href: string;
};

const partners: Partner[] = [
  {
    name: "RK Metaloplastika Šabac",
    logo: "/partners/rk-metaloplastika.jpg",
    href: "https://www.rkmetaloplastika.com/",
  },
  {
    name: "ŽRK Medicinar",
    logo: "/partners/zrk-medicinar.jpg",
    href: "https://zrkmedicinar.rs/",
  },
  {
    name: "ORK Mačva",
    logo: "/partners/ork-macva.jpg",
    href: "https://www.srbijasport.net/club/5473-macva/results",
  },
  {
    name: "KK Zorka",
    logo: "/partners/kk-zorka.jpg",
    href: "https://www.kkzorka.rs/",
  },
];

export default function Partners() {
  const t = useTranslations("partners");

  return (
    <Section className="bg-ivory">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 items-center"
      >
        {partners.map((partner) => (
          <a
            key={partner.name}
            href={partner.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={partner.name}
            className="group flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-white border border-gray-100 hover:border-teal/40 hover:shadow-[var(--shadow-soft)] transition-all"
          >
            <div className="relative w-full h-28 md:h-32">
              <Image
                src={partner.logo}
                alt={partner.name}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className="text-[11px] md:text-xs font-medium uppercase tracking-[0.15em] text-gray-500 group-hover:text-navy text-center transition-colors">
              {partner.name}
            </span>
          </a>
        ))}
      </motion.div>
    </Section>
  );
}
