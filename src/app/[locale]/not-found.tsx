import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function generateMetadata() {
  const t = await getTranslations("notFound");
  return {
    title: `${t("title")} | Sport Care Med`,
    description: t("description"),
  };
}

export default async function LocaleNotFound() {
  const t = await getTranslations("notFound");
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-teal mb-3">
          404
        </p>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-4">
          {t("title")}
        </h1>
        <p className="text-gray-600 mb-8">{t("description")}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-white font-medium hover:bg-navy/90 transition-colors"
        >
          {t("backHome")}
        </Link>
      </div>
    </section>
  );
}
