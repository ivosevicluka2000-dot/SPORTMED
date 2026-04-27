import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { b2bAllItems } from "@/lib/utils";
import B2BServiceDetail from "@/components/sections/B2BServiceDetail";

export async function generateStaticParams() {
  return [
    ...b2bAllItems.map((s) => ({ locale: "sr", slug: s.slug })),
    ...b2bAllItems.map((s) => ({ locale: "en", slug: s.slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const item = b2bAllItems.find((s) => s.slug === slug);
  if (!item) return {};

  const t = await getTranslations({ locale, namespace: "b2b" });
  const ns = item.kind === "kit" ? "kits" : "services";

  return {
    title: `${t(`${ns}.${slug}.title`)} | B2B | Sport Care Med`,
    description: t(`${ns}.${slug}.shortDescription`),
  };
}

export default async function B2BServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const item = b2bAllItems.find((s) => s.slug === slug);

  if (!item) {
    notFound();
  }

  return <B2BServiceDetail slug={slug} service={item} />;
}
