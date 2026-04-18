import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { b2bServices } from "@/lib/utils";
import B2BServiceDetail from "@/components/sections/B2BServiceDetail";

export async function generateStaticParams() {
  return b2bServices.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const service = b2bServices.find((s) => s.slug === slug);
  if (!service) return {};

  const t = await getTranslations({ locale, namespace: "b2b" });

  return {
    title: `${t(`services.${slug}.title`)} | B2B | Sport Care Med`,
    description: t(`services.${slug}.shortDescription`),
  };
}

export default async function B2BServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const service = b2bServices.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  return <B2BServiceDetail slug={slug} service={service} />;
}
