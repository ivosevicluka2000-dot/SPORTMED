"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Section, { SectionHeader } from "@/components/ui/Section";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Marko Petrović",
    role: {
      sr: "Fudbaler · povreda kolena (LCA)",
      en: "Footballer · knee injury (ACL)",
    },
    content: {
      sr: "Recovery Starter Kit + protokol za koleno — radio sam vežbe kod kuće svaki dan, foam roller i kinezio traka su me držali u igri između termina. Vratio sam se na teren za 6 nedelja umesto 12.",
      en: "Recovery Starter Kit + the knee protocol — I ran the drills at home every day; the foam roller and kinesio tape kept me moving between sessions. Back on the pitch in 6 weeks instead of 12.",
    },
  },
  {
    name: "Ana Jovanović",
    role: {
      sr: "Atletičarka · oporavak između treninga",
      en: "Track athlete · between-session recovery",
    },
    content: {
      sr: "Magnezijum + kompresione čarape + njihov protokol za oporavak posle teških treninga — drugi dan više nemam onaj “mrtav” osećaj u nogama. Vremena na 400m su mi pala za sekundu i po.",
      en: "Magnesium + compression socks + their post-session recovery protocol — that “dead legs” feeling on day two is gone. My 400m times dropped by a second and a half.",
    },
  },
  {
    name: "Stefan Nikolić",
    role: {
      sr: "Košarkaš · skočni zglob",
      en: "Basketball player · ankle",
    },
    content: {
      sr: "Pre nego što sam išao na pregled, uradio sam njihov besplatni Readiness Checklist i naručio kit za skočni zglob. Za 4 nedelje sam bio spreman za utakmicu — bez fizioterapije svaki drugi dan.",
      en: "Before booking anything I ran their free Readiness Checklist and ordered the ankle kit. Match-ready in 4 weeks — no every-other-day physio appointments needed.",
    },
  },
];

export default function Testimonials() {
  const t = useTranslations("testimonials");
  const locale = useLocale();
  const lang: "sr" | "en" = locale === "en" ? "en" : "sr";
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () =>
    setCurrent(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );

  return (
    <Section>
      <SectionHeader title={t("title")} subtitle={t("subtitle")} accent />

      <div className="max-w-3xl mx-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center px-4 md:px-12"
          >
            {/* Decorative quote */}
            <span className="block font-heading text-6xl text-gold/30 leading-none mb-4">&ldquo;</span>

            <p className="font-heading text-xl md:text-2xl text-gray-700 mb-10 leading-relaxed">
              {testimonials[current].content[lang]}
            </p>

            <div className="h-px w-8 bg-gold/40 mx-auto mb-6" />

            <p className="font-medium text-navy text-sm tracking-wide">
              {testimonials[current].name}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {testimonials[current].role[lang]}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-center items-center gap-6 mt-12">
          <button
            onClick={prev}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-teal hover:text-teal transition-colors cursor-pointer"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                  i === current ? "bg-teal w-4" : "bg-gray-300"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-teal hover:text-teal transition-colors cursor-pointer"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Section>
  );
}
