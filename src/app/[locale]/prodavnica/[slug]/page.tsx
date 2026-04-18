import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getProduct, getAllProductSlugs, getRelatedProducts } from "@/lib/queries";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import ProductDetail from "@/components/shop/ProductDetail";
import OftenBoughtTogether from "@/components/shop/OftenBoughtTogether";

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await getProduct(locale, slug);
  if (!product) return {};
  return {
    title: `${product.name} | Sport Care Med`,
    description: product.description?.slice(0, 160) || product.name,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });

  let product;
  try {
    product = await getProduct(locale, slug);
  } catch {
    product = null;
  }

  if (!product) notFound();

  let relatedProducts;
  try {
    relatedProducts = product.oftenBoughtWith
      ? await getRelatedProducts(locale, product.oftenBoughtWith)
      : [];
  } catch {
    relatedProducts = [];
  }

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Link
          href="/prodavnica"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 hover:text-navy transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToShop")}
        </Link>

        <ProductDetail product={product} />

        {relatedProducts.length > 0 && (
          <OftenBoughtTogether
            currentProduct={product}
            relatedProducts={relatedProducts}
          />
        )}
      </div>
    </section>
  );
}
