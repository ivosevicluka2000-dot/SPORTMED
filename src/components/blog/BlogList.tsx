"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import BlogCard from "./BlogCard";
import type { BlogPost, BlogCategory } from "@/types";

interface BlogListProps {
  posts: BlogPost[];
  categories: BlogCategory[];
}

export default function BlogList({ posts, categories }: BlogListProps) {
  const t = useTranslations("blog");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      !activeCategory ||
      post.categories?.some((c) => c.slug === activeCategory);
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal/20 focus:border-teal transition-colors"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
              !activeCategory
                ? "bg-navy text-white"
                : "border border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {t("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() =>
                setActiveCategory(
                  activeCategory === cat.slug ? null : cat.slug
                )
              }
              className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                activeCategory === cat.slug
                  ? "bg-navy text-white"
                  : "border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post, index) => (
            <BlogCard key={post._id} post={post} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            {activeCategory ? t("noPostsInCategory") : t("noPosts")}
          </p>
        </div>
      )}
    </div>
  );
}
