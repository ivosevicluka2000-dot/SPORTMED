import { getTranslations } from "next-intl/server";
import ContactContent from "@/components/sections/ContactContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return {
    title: `${t("title")} | Sport Care Med`,
    description: t("subtitle"),
  };
}

export default function ContactPage() {
  return <ContactContent />;
}
