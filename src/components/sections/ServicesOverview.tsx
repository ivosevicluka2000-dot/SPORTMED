"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import Section, { SectionHeader } from "@/components/ui/Section";
import PhotoLightbox from "@/components/ui/PhotoLightbox";
import {
  rehabTreatments,
  recoveryTreatments,
  treatmentImages,
  type TreatmentSlug,
} from "@/lib/utils";
import {
  Zap,
  Hand,
  Dumbbell,
  Stethoscope,
  HeartPulse,
  Sparkles,
  Snowflake,
  BarChart3,
  Circle,
  Link2,
  Tag,
  Wind,
  Vibrate,
  ArrowRight,
  Maximize2,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5" />,
  Hand: <Hand className="w-5 h-5" />,
  Dumbbell: <Dumbbell className="w-5 h-5" />,
  Stethoscope: <Stethoscope className="w-5 h-5" />,
  HeartPulse: <HeartPulse className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Snowflake: <Snowflake className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
  Circle: <Circle className="w-5 h-5" />,
  Link2: <Link2 className="w-5 h-5" />,
  Tag: <Tag className="w-5 h-5" />,
  Wind: <Wind className="w-5 h-5" />,
  Vibrate: <Vibrate className="w-5 h-5" />,
};

type TreatmentLike = { slug: TreatmentSlug; icon: string };

function TreatmentGrid({
  items,
  t,
  photoStartIndex,
  onOpenPhoto,
}: {
  items: readonly TreatmentLike[];
  t: ReturnType<typeof useTranslations>;
  photoStartIndex: number;
  onOpenPhoto: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
      {items.map((treatment, index) => (
        <motion.div
          key={treatment.slug}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
        >
          <div className="group relative h-full bg-white transition-colors hover:bg-ivory">
            <Link
              href={{ pathname: "/usluge/[slug]", params: { slug: treatment.slug } }}
              className="flex h-full cursor-pointer flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <Image
                  src={treatmentImages[treatment.slug]}
                  alt={t(`items.${treatment.slug}.title`)}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6 md:p-7 flex flex-col flex-1">
                <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-teal mb-4 group-hover:border-teal/30 transition-colors">
                  {iconMap[treatment.icon]}
                </div>
                <h3 className="font-heading text-base font-semibold text-navy mb-2">
                  {t(`items.${treatment.slug}.title`)}
                </h3>
                <p className="text-sm text-gray-400 mb-5 line-clamp-3 leading-relaxed">
                  {t(`items.${treatment.slug}.shortDescription`)}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-teal uppercase tracking-wider group-hover:gap-2.5 transition-all">
                  {t("learnMore")}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => onOpenPhoto(photoStartIndex + index)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-navy opacity-100 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-gold md:opacity-0 md:group-hover:opacity-100"
              aria-label={`Open ${t(`items.${treatment.slug}.title`)} photo fullscreen`}
              title="Open fullscreen"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function ServicesOverview() {
  const t = useTranslations("services");
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const visibleTreatments = [...rehabTreatments, ...recoveryTreatments];
  const servicePhotos = visibleTreatments.map((treatment) => ({
    src: treatmentImages[treatment.slug],
    alt: t(`items.${treatment.slug}.title`),
    label: t(`items.${treatment.slug}.title`),
  }));

  return (
    <>
      <Section>
        <SectionHeader
          title={t("groups.rehab.title")}
          subtitle={t("groups.rehab.subtitle")}
          label={t("groups.rehab.label")}
          accent
        />
        <TreatmentGrid
          items={rehabTreatments}
          t={t}
          photoStartIndex={0}
          onOpenPhoto={setActivePhoto}
        />
      </Section>

      <Section className="bg-ivory">
        <SectionHeader
          title={t("groups.recovery.title")}
          subtitle={t("groups.recovery.subtitle")}
          label={t("groups.recovery.label")}
          accent
        />
        <TreatmentGrid
          items={recoveryTreatments}
          t={t}
          photoStartIndex={rehabTreatments.length}
          onOpenPhoto={setActivePhoto}
        />
      </Section>

      {activePhoto !== null && (
        <PhotoLightbox
          photos={servicePhotos}
          initialIndex={activePhoto}
          open
          onClose={() => setActivePhoto(null)}
        />
      )}
    </>
  );
}
