"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ServiceFaq from "@/components/sections/ServiceFaq";
import StickyServiceCta from "@/components/sections/StickyServiceCta";
import { treatments } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle,
  Zap,
  Hand,
  Dumbbell,
  Stethoscope,
  HeartPulse,
  Sparkles,
  Snowflake,
  BarChart3,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-8 h-8" />,
  Hand: <Hand className="w-8 h-8" />,
  Dumbbell: <Dumbbell className="w-8 h-8" />,
  Stethoscope: <Stethoscope className="w-8 h-8" />,
  HeartPulse: <HeartPulse className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  Snowflake: <Snowflake className="w-8 h-8" />,
  BarChart3: <BarChart3 className="w-8 h-8" />,
};

const iconMapSmall: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5" />,
  Hand: <Hand className="w-5 h-5" />,
  Dumbbell: <Dumbbell className="w-5 h-5" />,
  Stethoscope: <Stethoscope className="w-5 h-5" />,
  HeartPulse: <HeartPulse className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Snowflake: <Snowflake className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
};

interface TreatmentDetailProps {
  slug: string;
  treatment: (typeof treatments)[number];
}

export default function TreatmentDetail({
  slug,
  treatment,
}: TreatmentDetailProps) {
  const t = useTranslations("services");

  const benefits: string[] = t
    .raw(`items.${slug}.benefits`) as string[];
  const faqItems = t.raw(`items.${slug}.faq`) as { question: string; answer: string }[];
  const relatedTreatments = treatments.filter((rt) =>
    (treatment.relatedSlugs as readonly string[]).includes(rt.slug)
  );

  // FAQ JSON-LD schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      {/* FAQ Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Hero */}
      <section className="bg-navy py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/usluge"
            className="inline-flex items-center text-white/40 hover:text-white transition-colors mb-10 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("viewAll")}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-start gap-6"
          >
            <div className="w-16 h-16 rounded-full border border-teal/30 flex items-center justify-center text-teal flex-shrink-0">
              {iconMap[treatment.icon]}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-white mb-4">
                {t(`items.${slug}.title`)}
              </h1>
              <p className="text-lg text-white/60 max-w-2xl">
                {t(`items.${slug}.shortDescription`)}
              </p>
              <div className="flex items-center gap-2 mt-5">
                <Badge variant="teal">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {t(`items.${slug}.duration`)}
                </Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl font-heading font-semibold text-navy mb-4">
                {t(`items.${slug}.title`)}
              </h2>
              <p className="text-gray-500 leading-relaxed mb-10">
                {t(`items.${slug}.description`)}
              </p>

              {/* Process */}
              <h3 className="text-lg font-heading font-semibold text-navy mb-5">
                {t("process")}
              </h3>
              <div className="flex flex-wrap gap-3 mb-8">
                {t(`items.${slug}.process`)
                  .split("→")
                  .map((step: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-2"
                    >
                      <span className="w-7 h-7 rounded-full border border-teal/30 flex items-center justify-center text-teal text-xs font-medium">
                        {i + 1}
                      </span>
                      <span className="text-gray-600 text-sm font-medium">
                        {step.trim()}
                      </span>
                      {i <
                        t(`items.${slug}.process`).split("→")
                          .length -
                          1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-1" />
                      )}
                    </div>
                  ))}
              </div>

              {/* FAQ */}
              {faqItems.length > 0 && (
                <div className="mt-10">
                  <ServiceFaq items={faqItems} title={t("faq")} />
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              {/* Benefits */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-sm font-heading font-semibold text-navy mb-4 uppercase tracking-wider">
                  {t("benefits")}
                </h3>
                <ul className="space-y-3">
                  {benefits.map((benefit: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                      <span className="text-gray-500 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="bg-ivory border border-gold/20 rounded-xl p-6">
                <h3 className="text-lg font-heading font-semibold text-navy mb-2">
                  {t("bookNow")}
                </h3>
                <p className="text-sm text-gray-400 mb-5">
                  {t(`items.${slug}.shortDescription`)}
                </p>
                <Link href="/prodavnica" className="block">
                  <Button className="w-full">
                    {t("bookNow")}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Related treatments */}
      {relatedTreatments.length > 0 && (
        <Section className="bg-ivory">
          <h2 className="text-2xl font-heading font-semibold text-navy mb-10">
            {t("relatedServices")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedTreatments.map((rt) => (
              <Link key={rt.slug} href={{ pathname: "/usluge/[slug]", params: { slug: rt.slug } }}>
                <div className="group border border-gray-100 rounded-xl p-6 hover:shadow-[var(--shadow-soft)] transition-shadow bg-white">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center text-teal group-hover:border-teal transition-colors flex-shrink-0">
                      {iconMapSmall[rt.icon]}
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-navy mb-1">
                        {t(`items.${rt.slug}.title`)}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t(`items.${rt.slug}.shortDescription`)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Mobile sticky CTA */}
      <StickyServiceCta />
    </>
  );
}
