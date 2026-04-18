import { getTranslations } from "next-intl/server";
import { getBlogPosts, getBlogCategories } from "@/lib/queries";
import BlogList from "@/components/blog/BlogList";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: `${t("title")} | Sport Care Med`,
    description: t("subtitle"),
  };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  const [posts, categories] = await Promise.all([
    getBlogPosts(locale),
    getBlogCategories(locale),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-8 h-px bg-[var(--color-gold)] mx-auto mb-4" />
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-base text-gray-400 max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Blog listing */}
      <section className="py-16 md:py-24 bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BlogList posts={posts} categories={categories} />
        </div>
      </section>
    </>
  );
}
