import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import type { BlogPost } from "@/types";

interface RelatedPostsProps {
  posts: BlogPost[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  const t = useTranslations("blog");

  if (!posts || posts.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      <h2 className="text-2xl font-heading font-semibold text-navy mb-10">
        {t("relatedPosts")}
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          const formattedDate = new Date(post.publishedAt).toLocaleDateString(
            "sr-Latn",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          );

          return (
            <Link
              key={post._id}
              href={{ pathname: "/blog/[slug]", params: { slug: post.slug.current } }}
              className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-[var(--shadow-soft)] transition-shadow"
            >
              <div className="relative h-40 bg-ivory overflow-hidden">
                {post.mainImage ? (
                  <Image
                    src={post.mainImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl text-gray-200 font-heading font-semibold">SCM</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-gray-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t("readingTime", { minutes: post.readingTime })}
                  </span>
                </div>
                <h3 className="font-heading font-semibold text-navy group-hover:text-teal transition-colors line-clamp-2 mb-2">
                  {post.title}
                </h3>
                <span className="flex items-center gap-1 text-teal text-xs font-medium uppercase tracking-wider">
                  {t("readMore")}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
