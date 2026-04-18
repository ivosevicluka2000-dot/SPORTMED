import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { treatments } from "@/lib/utils";
import TreatmentDetail from "@/components/sections/TreatmentDetail";

export async function generateStaticParams() {
  return treatments.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const treatment = treatments.find((t) => t.slug === slug);
  if (!treatment) return {};

  const t = await getTranslations({ locale, namespace: "services" });

  return {
    title: `${t(`items.${slug}.title`)} | Sport Care Med`,
    description: t(`items.${slug}.shortDescription`),
  };
}

export default async function TreatmentPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const treatment = treatments.find((t) => t.slug === slug);

  if (!treatment) {
    notFound();
  }

  return <TreatmentDetail slug={slug} treatment={treatment} />;
}
