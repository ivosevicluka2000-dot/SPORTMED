"use client";

import { useTranslations } from "next-intl";
import type { ProductCategory } from "@/types";

interface ProductFiltersProps {
  categories: ProductCategory[];
  selectedCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export default function ProductFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: ProductFiltersProps) {
  const t = useTranslations("shop");

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
            !selectedCategory
              ? "bg-navy text-white"
              : "border border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          {t("allCategories")}
        </button>
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => onCategoryChange(cat.slug)}
            className={`px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
              selectedCategory === cat.slug
                ? "bg-navy text-white"
                : "border border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-4 py-2 rounded-md border border-gray-200 text-sm text-gray-600 bg-white cursor-pointer focus:border-teal focus:ring-1 focus:ring-teal/20 outline-none transition-colors"
      >
        <option value="featured">{t("sortFeatured")}</option>
        <option value="price-asc">{t("sortPriceAsc")}</option>
        <option value="price-desc">{t("sortPriceDesc")}</option>
        <option value="name">{t("sortName")}</option>
      </select>
    </div>
  );
}
