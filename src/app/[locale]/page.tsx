import { getTranslations } from "next-intl/server";
import Hero from "@/components/sections/Hero";
import ServicesOverview from "@/components/sections/ServicesOverview";
import WhyUs from "@/components/sections/WhyUs";
import Testimonials from "@/components/sections/Testimonials";
import CaseStudies from "@/components/sections/CaseStudies";
import Partners from "@/components/sections/Partners";
import LocationPreview from "@/components/sections/LocationPreview";
import Newsletter from "@/components/sections/Newsletter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesOverview />
      <WhyUs />
      <Testimonials />
      <CaseStudies />
      <Partners />
      <LocationPreview />
      <Newsletter />
    </>
  );
}
