import { getTranslations } from "next-intl/server";
import { getProducts, getProductCategories } from "@/lib/queries";
import ShopContent from "@/components/shop/ShopContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  const [products, categories] = await Promise.all([
    getProducts(locale),
    getProductCategories(locale),
  ]);

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="w-8 h-px bg-[var(--color-gold)] mx-auto mb-4" />
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-navy mb-4 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-base text-gray-400 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <ShopContent products={products} categories={categories} />
      </div>
    </section>
  );
}
