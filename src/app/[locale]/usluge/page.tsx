import { getTranslations } from "next-intl/server";
import Image from "next/image";
import ServicesOverview from "@/components/sections/ServicesOverview";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });

  return {
    title: `${t("title")} | Sport Care Med`,
    description: t("subtitle"),
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "services" });

  return (
    <>
      <section className="relative bg-navy min-h-[64vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/hero/sport-care-hero.png"
          alt=""
          fill
          preload
          sizes="100vw"
          aria-hidden="true"
          className="absolute inset-0 object-cover object-center"
        />

        <div className="absolute inset-0 bg-navy/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/30 via-transparent to-navy/80" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-8 bg-gold" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
              Sport Care Med
            </span>
            <div className="h-px w-8 bg-gold" />
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-8">
            {t("title")}
          </h1>

          <p className="text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/20 to-transparent" />
      </section>

      <ServicesOverview />
    </>
  );
}
