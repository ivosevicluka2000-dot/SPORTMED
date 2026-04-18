import { getTranslations } from "next-intl/server";
import ReadinessChecklist from "@/components/tools/ReadinessChecklist";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.readinessChecklist" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ReadinessChecklistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.readinessChecklist" });

  // FAQ Schema JSON-LD
  const faqItems = [0, 1, 2].map((i) => ({
    "@type": "Question" as const,
    name: t(`faq.${i}.question`),
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: t(`faq.${i}.answer`),
    },
  }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block text-teal text-sm font-medium tracking-wide uppercase mb-4">
              {t("title")}
            </span>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-navy mb-4">
              {t("title")}
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              {t("description")}
            </p>
          </div>

          <ReadinessChecklist />

          {/* FAQ section */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl font-bold text-navy mb-8 text-center">
              FAQ
            </h2>
            <div className="space-y-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-b border-gray-100 pb-6 last:border-0">
                  <h3 className="font-semibold text-navy text-sm mb-2">
                    {t(`faq.${i}.question`)}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {t(`faq.${i}.answer`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
