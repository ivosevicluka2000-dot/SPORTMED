import { getTranslations } from "next-intl/server";
import LocationContent from "@/components/sections/LocationContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "location" });

  return {
    title: `${t("title")} | Sport Care Med`,
    description: t("subtitle"),
  };
}

export default function LocationPage() {
  return <LocationContent />;
}
