"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import Section, { SectionHeader } from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowRight, Trophy, Clock, Activity } from "lucide-react";

export default function CaseStudies() {
  const t = useTranslations("caseStudies");
  const items = t.raw("items") as Array<{
    name: string;
    sport: string;
    injury: string;
    result: string;
    story: string;
    duration: string;
    services: string[];
  }>;

  return (
    <Section className="bg-ivory">
      <SectionHeader
        title={t("title")}
        subtitle={t("subtitle")}
        label={t("label")}
        accent
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-[var(--shadow-soft)] transition-shadow"
          >
            {/* Result banner */}
            <div className="bg-navy p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-gold" />
                <span className="text-xs font-medium uppercase tracking-wider text-gold">
                  {item.sport}
                </span>
              </div>
              <p className="text-white font-heading font-semibold text-lg leading-snug">
                {item.result}
              </p>
            </div>

            <div className="p-6">
              {/* Patient info */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal font-semibold text-sm">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-navy text-sm">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.injury}</p>
                </div>
              </div>

              {/* Story */}
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                {item.story}
              </p>

              {/* Duration */}
              <div className="flex items-center gap-4 mb-5 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {item.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  {item.services.length} {item.services.length === 1 ? "service" : "services"}
                </span>
              </div>

              {/* Service tags */}
              <div className="flex flex-wrap gap-1.5">
                {item.services.map((service, i) => (
                  <Badge key={i} variant="gray">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mt-12"
      >
        <Link href="/prodavnica">
          <Button size="lg">
            {t("cta")}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </motion.div>
    </Section>
  );
}
