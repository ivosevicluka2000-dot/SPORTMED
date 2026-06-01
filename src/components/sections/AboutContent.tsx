"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";
import Section, { SectionHeader } from "@/components/ui/Section";
import { clinicPhotos } from "@/lib/clinic-photos";
import {
  Target,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const teamMembers = [
  {
    name: "Tijana Tanasković",
    role: "diplomirani fizioterapeut",
    image: "/about/tijana-tanaskovic.png",
    alt: "Tijana Tanasković, diplomirani fizioterapeut u Sport Care & Med timu",
    imageClassName: "object-[58%_35%]",
  },
  {
    name: "Ognjen Živanović",
    role: "strukovni fizioterapeut",
    image: "/about/ognjen-zivanovic.png",
    alt: "Ognjen Živanović, strukovni fizioterapeut u Sport Care & Med timu",
    imageClassName: "object-[58%_35%]",
  },
];

export default function AboutContent() {
  const t = useTranslations("about");
  const [activePhoto, setActivePhoto] = useState(0);
  const currentPhoto = clinicPhotos[activePhoto];
  const totalPhotos = clinicPhotos.length;
  const showPreviousPhoto = () => {
    setActivePhoto((index) => (index === 0 ? totalPhotos - 1 : index - 1));
  };
  const showNextPhoto = () => {
    setActivePhoto((index) => (index === totalPhotos - 1 ? 0 : index + 1));
  };

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="overflow-hidden rounded-lg border border-gray-100 bg-white text-center shadow-[var(--shadow-soft)]"
            >
              <div className="relative aspect-[3/4] bg-ivory">
                <Image
                  src={member.image}
                  alt={member.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 360px"
                  className={`object-cover ${member.imageClassName}`}
                />
              </div>
              <div className="px-5 py-5">
                <h3 className="text-lg font-heading font-semibold text-navy mb-1">
                  {member.name}
                </h3>
                <p className="text-[11px] uppercase tracking-wider text-gray-400">
                  {member.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Gallery */}
      <Section className="bg-ivory">
        <SectionHeader
          title={t("gallery.title")}
          subtitle={t("gallery.subtitle")}
          accent
        />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-lg border border-gray-100 bg-white shadow-[var(--shadow-soft)]">
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/8] bg-navy/5">
              <motion.div
                key={currentPhoto.src}
                initial={{ opacity: 0, scale: 1.015 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={currentPhoto.src}
                  alt={currentPhoto.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover"
                  priority={activePhoto === 0}
                />
              </motion.div>
            </div>

            <button
              type="button"
              onClick={showPreviousPhoto}
              aria-label="Prethodna fotografija"
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-navy shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-gold md:left-5 md:h-12 md:w-12"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNextPhoto}
              aria-label="Sledeća fotografija"
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-navy shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-gold md:right-5 md:h-12 md:w-12"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 bg-gradient-to-t from-navy/75 via-navy/35 to-transparent px-4 pb-4 pt-12 md:px-6 md:pb-5">
              <span className="font-heading text-sm font-semibold text-white">
                {String(activePhoto + 1).padStart(2, "0")} / {String(totalPhotos).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-2">
                {clinicPhotos.map((photo, index) => (
                  <button
                    key={photo.src}
                    type="button"
                    onClick={() => setActivePhoto(index)}
                    aria-label={`Prikaži fotografiju ${index + 1}`}
                    aria-current={index === activePhoto ? "true" : undefined}
                    className={`h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-gold ${
                      index === activePhoto ? "w-8 bg-gold" : "w-2.5 bg-white/75 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </Section>
    </>
  );
}
