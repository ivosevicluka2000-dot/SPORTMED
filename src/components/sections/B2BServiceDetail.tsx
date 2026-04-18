"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import Section from "@/components/ui/Section";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ServiceFaq from "@/components/sections/ServiceFaq";
import { b2bServices } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  HeartPulse,
  MapPinned,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Users,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  HeartPulse: <HeartPulse className="w-8 h-8" />,
  MapPinned: <MapPinned className="w-8 h-8" />,
  ShieldCheck: <ShieldCheck className="w-8 h-8" />,
  BarChart3: <BarChart3 className="w-8 h-8" />,
};

const iconMapSmall: Record<string, React.ReactNode> = {
  HeartPulse: <HeartPulse className="w-5 h-5" />,
  MapPinned: <MapPinned className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
};

interface B2BServiceDetailProps {
  slug: string;
  service: (typeof b2bServices)[number];
}

export default function B2BServiceDetail({ slug, service }: B2BServiceDetailProps) {
  const t = useTranslations("b2b");

  const includes: string[] = t.raw(`services.${slug}.includes`) as string[];
  const benefits: string[] = t.raw(`services.${slug}.benefits`) as string[];
  const idealFor: string[] = t.raw(`services.${slug}.idealFor`) as string[];
  const stats = t.raw(`services.${slug}.stats`) as { value: string; label: string }[];
  const faqItems = t.raw(`services.${slug}.faq`) as { question: string; answer: string }[];

  const relatedServices = b2bServices.filter((rs) =>
    (service.relatedSlugs as readonly string[]).includes(rs.slug)
  );

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="bg-navy py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/b2b"
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
              {iconMap[service.icon]}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-white mb-4">
                {t(`services.${slug}.title`)}
              </h1>
              <p className="text-lg text-white/60 max-w-2xl">
                {t(`services.${slug}.shortDescription`)}
              </p>
              <div className="flex items-center gap-2 mt-5">
                <Badge variant="teal">
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  {t("forTeams")}
                </Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Outcome Stats Strip */}
      <section className="bg-gradient-to-r from-navy via-navy-light to-navy py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-heading font-bold text-teal mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
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
                {t(`services.${slug}.title`)}
              </h2>
              <p className="text-gray-500 leading-relaxed mb-10">
                {t(`services.${slug}.description`)}
              </p>

              {/* What's included */}
              <h3 className="text-lg font-heading font-semibold text-navy mb-5 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal" />
                Šta uključuje
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                {includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-teal-50/50 rounded-lg p-3">
                    <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>

              {/* Process */}
              <h3 className="text-lg font-heading font-semibold text-navy mb-5">
                Kako funkcioniše
              </h3>
              <div className="flex flex-wrap gap-3 mb-10">
                {t(`services.${slug}.process`)
                  .split("→")
                  .map((step: string, i: number, arr: string[]) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full border border-teal/30 flex items-center justify-center text-teal text-xs font-medium">
                        {i + 1}
                      </span>
                      <span className="text-gray-600 text-sm font-medium">
                        {step.trim()}
                      </span>
                      {i < arr.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-1" />
                      )}
                    </div>
                  ))}
              </div>

              {/* FAQ */}
              {faqItems.length > 0 && (
                <div className="mt-10">
                  <ServiceFaq items={faqItems} title="Često postavljana pitanja" />
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
                  Prednosti
                </h3>
                <ul className="space-y-3">
                  {benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                      <span className="text-gray-500 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ideal for */}
              <div className="border border-gray-100 rounded-xl p-6">
                <h3 className="text-sm font-heading font-semibold text-navy mb-4 uppercase tracking-wider">
                  Idealno za
                </h3>
                <div className="flex flex-wrap gap-2">
                  {idealFor.map((audience, i) => (
                    <Badge key={i} variant="gray">
                      {audience}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-ivory border border-gold/20 rounded-xl p-6">
                <h3 className="text-lg font-heading font-semibold text-navy mb-2">
                  {t("proposal.title")}
                </h3>
                <p className="text-sm text-gray-400 mb-5">
                  {t(`services.${slug}.shortDescription`)}
                </p>
                <a href="/b2b#proposal" className="block">
                  <Button className="w-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {t("quote.submit")}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Related B2B services */}
      {relatedServices.length > 0 && (
        <Section className="bg-ivory">
          <h2 className="text-2xl font-heading font-semibold text-navy mb-10">
            Povezane B2B usluge
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedServices.map((rs) => (
              <Link key={rs.slug} href={{ pathname: "/b2b/[slug]", params: { slug: rs.slug } }}>
                <div className="group border border-gray-100 rounded-xl p-6 hover:shadow-[var(--shadow-soft)] transition-shadow bg-white">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center text-teal group-hover:border-teal transition-colors flex-shrink-0">
                      {iconMapSmall[rs.icon]}
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-navy mb-1">
                        {t(`services.${rs.slug}.title`)}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t(`services.${rs.slug}.shortDescription`)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
