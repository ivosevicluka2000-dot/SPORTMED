import { getTranslations } from "next-intl/server";
import B2BContent from "@/components/sections/B2BContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "b2b" });

  return {
    title: `${t("title")} | Sport Care Med`,
    description: t("subtitle"),
  };
}

export default function B2BPage() {
  return <B2BContent />;
}
