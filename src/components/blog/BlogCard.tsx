"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { BlogPost } from "@/types";

interface BlogCardProps {
  post: BlogPost;
  index?: number;
}

export default function BlogCard({ post, index = 0 }: BlogCardProps) {
  const t = useTranslations("blog");

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("sr-Latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-[var(--shadow-soft)] transition-shadow"
    >
      <Link href={{ pathname: "/blog/[slug]", params: { slug: post.slug.current } }} className="block">
        {/* Image */}
        <div className="relative h-48 sm:h-52 bg-ivory overflow-hidden">
          {post.mainImage ? (
            <img
              src={post.mainImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl text-gray-200 font-heading font-semibold">SCM</span>
            </div>
          )}
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="absolute top-3 left-3 flex gap-2">
              {post.categories.map((cat) => (
                <span
                  key={cat._id}
                  className="px-2.5 py-1 bg-navy text-white text-[10px] font-medium uppercase tracking-wider rounded-md"
                >
                  {cat.title}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {t("readingTime", { minutes: post.readingTime })}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-heading font-semibold text-navy mb-2 group-hover:text-teal transition-colors line-clamp-2">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-400 text-sm leading-relaxed mb-5 line-clamp-3">
            {post.excerpt}
          </p>

          {/* Author & Read More */}
          <div className="flex items-center justify-between">
            {post.author && (
              <div className="flex items-center gap-2">
                {post.author.image ? (
                  <img
                    src={post.author.image}
                    alt={post.author.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full border border-teal/30 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-teal">
                      {post.author.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-400">{post.author.name}</span>
              </div>
            )}
            <span className="flex items-center gap-1 text-teal text-xs font-medium uppercase tracking-wider group-hover:gap-2 transition-all">
              {t("readMore")}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
