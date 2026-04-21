import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });

  return {
    title: `${t("title")} | Sport Care Med`,
    description: t("intro"),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-3xl md:text-4xl font-heading font-semibold text-navy mb-4">
        {t("title")}
      </h1>
      <p className="text-sm text-gray-400 mb-8">{t("lastUpdated")}</p>
      <div className="prose prose-sm max-w-none text-gray-600 space-y-6">
        <p>{t("intro")}</p>
        <section>
          <h2 className="text-xl font-heading font-semibold text-navy">
            {t("sections.dataCollected.title")}
          </h2>
          <p>{t("sections.dataCollected.body")}</p>
        </section>
        <section>
          <h2 className="text-xl font-heading font-semibold text-navy">
            {t("sections.dataUse.title")}
          </h2>
          <p>{t("sections.dataUse.body")}</p>
        </section>
        <section>
          <h2 className="text-xl font-heading font-semibold text-navy">
            {t("sections.cookies.title")}
          </h2>
          <p>{t("sections.cookies.body")}</p>
        </section>
        <section>
          <h2 className="text-xl font-heading font-semibold text-navy">
            {t("sections.rights.title")}
          </h2>
          <p>{t("sections.rights.body")}</p>
        </section>
        <section>
          <h2 className="text-xl font-heading font-semibold text-navy">
            {t("sections.contact.title")}
          </h2>
          <p>{t("sections.contact.body")}</p>
        </section>
      </div>
    </main>
  );
}
