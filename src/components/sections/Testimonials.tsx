"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Section, { SectionHeader } from "@/components/ui/Section";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Marko Petrović",
    role: "Fudbalski igrač / Football player",
    content: {
      sr: "Zahvaljujući timu Sport Care Med-a, vratio sam se na teren za rekordno vreme nakon povrede ligamenata kolena. Profesionalni pristup i vrhunska oprema.",
      en: "Thanks to the Sport Care Med team, I returned to the field in record time after a knee ligament injury. Professional approach and top equipment.",
    },
  },
  {
    name: "Ana Jovanović",
    role: "Atletičarka / Athlete",
    content: {
      sr: "Redovno koristim recovery terapije nakon treninga. Primetila sam ogromnu razliku u oporavku i performansama. Preporučujem svima!",
      en: "I regularly use recovery therapies after training. I noticed a huge difference in recovery and performance. Highly recommend!",
    },
  },
  {
    name: "Stefan Nikolić",
    role: "Košarkaš / Basketball player",
    content: {
      sr: "Dijagnostika u Sport Care Med-u mi je pomogla da na vreme otkrijem problem i sprečim ozbiljniju povredu. Stručan i pažljiv tim.",
      en: "Diagnostics at Sport Care Med helped me detect a problem early and prevent a serious injury. Expert and attentive team.",
    },
  },
];

export default function Testimonials() {
  const t = useTranslations("testimonials");
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
              {testimonials[current].content.sr}
            </p>

            <div className="h-px w-8 bg-gold/40 mx-auto mb-6" />

            <p className="font-medium text-navy text-sm tracking-wide">
              {testimonials[current].name}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {testimonials[current].role}
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
