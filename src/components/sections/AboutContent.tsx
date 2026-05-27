"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";
import Section, { SectionHeader } from "@/components/ui/Section";
import { Target, Eye, Award, Stethoscope, GraduationCap, CheckCircle2 } from "lucide-react";

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

const clinicPhotos = [
  {
    src: "/about/clinic-exterior.jpeg",
    alt: "Ulaz u Sport Care & Med kliniku",
    className: "md:col-span-2 md:row-span-2 aspect-[16/10] md:aspect-auto",
  },
  {
    src: "/about/treatment-room.jpeg",
    alt: "Terapijski sto u Sport Care & Med ordinaciji",
    className: "aspect-[4/3]",
  },
  {
    src: "/about/waiting-area.jpeg",
    alt: "Prostor za čekanje u Sport Care & Med klinici",
    className: "aspect-[4/3]",
  },
  {
    src: "/about/treatment-room-entry.jpeg",
    alt: "Ulaz u terapijsku prostoriju Sport Care & Med klinike",
    className: "md:col-span-2 aspect-[16/9]",
  },
];

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

      {/* Founder spotlight */}
      <Section className="bg-ivory">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="order-1 md:order-1"
          >
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto md:mx-0 rounded-lg border border-gray-200 bg-white overflow-hidden shadow-[var(--shadow-soft)]">
              <Image
                src="/about/founder-djordje-ignjatovic.png"
                alt={t("founder.photoAlt")}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
                priority={false}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="order-2 md:order-2"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-gold" />
              <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
                {t("founder.eyebrow")}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-heading font-semibold text-navy mb-2">
              {t("founder.name")}
            </h2>
            <p className="text-sm uppercase tracking-wider text-teal font-medium mb-6">
              {t("founder.role")}
            </p>
            <p className="text-gray-500 leading-relaxed mb-7">
              {t("founder.bio")}
            </p>
            <ul className="flex flex-wrap gap-2">
              {(t.raw("founder.credentials") as string[]).map((credential) => (
                <li
                  key={credential}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal" />
                  {credential}
                </li>
              ))}
            </ul>
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

      {/* Team — supporting members under the founder */}
      <Section>
        <SectionHeader
          title={t("team.title")}
          subtitle={t("team.subtitle")}
          accent
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
                <div className="w-20 h-20 rounded-full border border-gray-200 flex items-center justify-center mx-auto mb-4 bg-ivory">
                  <Icon className="w-8 h-8 text-teal/70" />
                </div>
                <h3 className="text-base font-heading font-semibold text-navy mb-1">
                  {member.name}
                </h3>
                <p className="text-[11px] uppercase tracking-wider text-gray-400">
                  {member.roleKey}
                </p>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Gallery */}
      <Section className="bg-ivory">
        <SectionHeader
          title={t("gallery.title")}
          subtitle={t("gallery.subtitle")}
          accent
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 md:auto-rows-[220px] lg:auto-rows-[260px] gap-3">
          {clinicPhotos.map((photo, index) => (
            <motion.div
              key={photo.src}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className={`relative overflow-hidden rounded-lg border border-gray-100 bg-white shadow-[var(--shadow-soft)] ${photo.className}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes={
                  index === 0
                    ? "(max-width: 768px) 100vw, 50vw"
                    : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                }
                className="object-cover"
              />
            </motion.div>
          ))}
        </div>
      </Section>
    </>
  );
}
