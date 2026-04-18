"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Section, { SectionHeader } from "@/components/ui/Section";
import { Target, Eye, Award, Stethoscope, GraduationCap } from "lucide-react";

const teamMembers = [
  {
    name: "Dr. Placeholder",
    roleKey: "Specijalista sportske medicine",
    image: null,
  },
  {
    name: "Fizioterapeut Placeholder",
    roleKey: "Diplomirani fizioterapeut",
    image: null,
  },
  {
    name: "Kineziterapeut Placeholder",
    roleKey: "Kineziterapeut",
    image: null,
  },
];

const teamIcons = [Stethoscope, Award, GraduationCap];

export default function AboutContent() {
  const t = useTranslations("about");

  return (
    <>
      {/* Hero */}
      <section className="bg-navy py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <span className="h-px w-8 bg-gold" />
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium">
              Sport Care Med
            </span>
            <span className="h-px w-8 bg-gold" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold text-white mb-5"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            {t("subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <Section>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <span className="h-px w-12 bg-gold block mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-navy mb-6">
              {t("story.title")}
            </h2>
            <p className="text-gray-500 leading-relaxed text-lg">
              {t("story.description")}
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Mission & Vision */}
      <Section className="bg-ivory">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 rounded-xl overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white p-8 md:p-10"
          >
            <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center mb-5">
              <Target className="w-5 h-5 text-teal" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-navy mb-3">
              {t("mission.title")}
            </h3>
            <p className="text-gray-500 leading-relaxed">
              {t("mission.description")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 md:p-10"
          >
            <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center mb-5">
              <Eye className="w-5 h-5 text-teal" />
            </div>
            <h3 className="text-xl font-heading font-semibold text-navy mb-3">
              {t("vision.title")}
            </h3>
            <p className="text-gray-500 leading-relaxed">
              {t("vision.description")}
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Team */}
      <Section>
        <SectionHeader
          title={t("team.title")}
          subtitle={t("team.subtitle")}
          accent
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => {
            const Icon = teamIcons[index];
            return (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-28 h-28 rounded-full border border-gray-200 flex items-center justify-center mx-auto mb-5 bg-ivory">
                  <Icon className="w-10 h-10 text-teal/70" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-navy mb-1">
                  {member.name}
                </h3>
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  {member.roleKey}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Gallery placeholder */}
      <Section className="bg-ivory">
        <SectionHeader
          title={t("gallery.title")}
          subtitle={t("gallery.subtitle")}
          accent
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-[4/3] bg-white border border-gray-100 rounded-lg flex items-center justify-center"
            >
              <span className="text-gray-300 text-xs uppercase tracking-wider">
                Photo {i}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
