"use client";

import { Link } from "@/i18n/routing";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import type { BlogPost } from "@/types";
import AuthorCard from "./AuthorCard";
import ShareButtons from "./ShareButtons";
import RelatedPosts from "./RelatedPosts";
import PortableTextRenderer from "./PortableTextRenderer";

interface BlogPostContentProps {
  post: BlogPost;
  labels: {
    by: string;
    publishedOn: string;
    backToBlog: string;
  };
}

export default function BlogPostContent({
  post,
  labels,
}: BlogPostContentProps) {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString(
    "sr-Latn",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const postUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://sportcaremed.rs/blog/${post.slug.current}`;

  return (
    <article>
      {/* Hero */}
      <section className="bg-navy text-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-10 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {labels.backToBlog}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {post.categories.map((cat) => (
                  <span
                    key={cat._id}
                    className="px-2.5 py-1 border border-teal/30 text-teal text-[10px] font-medium uppercase tracking-wider rounded-md"
                  >
                    {cat.title}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-semibold mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-white/40 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {labels.publishedOn} {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readingTime} min
              </span>
              {post.author && (
                <span>
                  {labels.by} {post.author.name}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main image */}
      {post.mainImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <motion.img
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            src={post.mainImage}
            alt={post.title}
            className="w-full rounded-xl shadow-[var(--shadow-elevated)] max-h-[500px] object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-[1fr,260px] gap-12">
          {/* Article body */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="prose prose-lg max-w-none"
          >
            {post.body && <PortableTextRenderer value={post.body} />}
          </motion.div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Author */}
            {post.author && (
              <AuthorCard author={post.author} label={labels.by} />
            )}

            {/* Share */}
            <div className="p-4 bg-ivory rounded-xl border border-gray-100">
              <ShareButtons title={post.title} url={postUrl} />
            </div>
          </aside>
        </div>

        {/* Related posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <RelatedPosts posts={post.relatedPosts} />
        )}
      </div>
    </article>
  );
}
