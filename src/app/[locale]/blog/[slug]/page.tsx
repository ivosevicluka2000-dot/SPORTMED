import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getBlogPost, getAllBlogSlugs } from "@/lib/queries";
import BlogPostContent from "@/components/blog/BlogPostContent";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const [srSlugs, enSlugs] = await Promise.all([
    getAllBlogSlugs("sr"),
    getAllBlogSlugs("en"),
  ]);

  return [
    ...srSlugs.map((s) => ({ locale: "sr", slug: s.slug })),
    ...enSlugs.map((s) => ({ locale: "en", slug: s.slug })),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPost(locale, slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} | Sport Care Med Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      ...(post.mainImage && { images: [{ url: post.mainImage }] }),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const post = await getBlogPost(locale, slug);

  if (!post) {
    notFound();
  }

  // JSON-LD for blog post
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    ...(post.mainImage && { image: post.mainImage }),
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.name,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Sport Care Med",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostContent
        post={post}
        labels={{
          by: t("by"),
          publishedOn: t("publishedOn"),
          backToBlog: t("backToBlog"),
        }}
      />
    </>
  );
}
