import { getTranslations } from "next-intl/server";
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

export default function ServicesPage() {
  return (
    <div className="pt-8">
      <ServicesOverview />
    </div>
  );
}
