import { getTranslations } from "next-intl/server";
import AboutContent from "@/components/sections/AboutContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: `${t("title")} | Sport Care Med`,
    description: t("subtitle"),
  };
}

export default function AboutPage() {
  return <AboutContent />;
}
