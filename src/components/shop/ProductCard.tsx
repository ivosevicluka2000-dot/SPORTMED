"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import type { Product } from "@/types";
import { ShoppingCart, FileDown } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function ProductCard({ product }: { product: Product }) {
  const t = useTranslations("shop");
  const { addItem } = useCart();
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100
        )
      : null;

  const isPdf = product.type === "pdf" || product.price === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPdf) {
      alert(t("pdfComingSoon"));
      return;
    }
    if (product.stock <= 0) return;
    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] || "",
      price: product.price,
      quantity: 1,
      stock: product.stock,
    });
  };

  return (
    <Link
      href={{ pathname: "/prodavnica/[slug]", params: { slug: product.slug } }}
      className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-[var(--shadow-soft)] transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-square bg-ivory overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            {isPdf ? (
              <FileDown className="w-10 h-10" />
            ) : (
              <ShoppingCart className="w-10 h-10" />
            )}
          </div>
        )}
        {isPdf && (
          <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-medium px-2.5 py-1 rounded-md">
            {t("freeBadge")}
          </span>
        )}
        {!isPdf && discount && (
          <span className="absolute top-3 left-3 bg-navy text-white text-xs font-medium px-2.5 py-1 rounded-md">
            -{discount}%
          </span>
        )}
        {!isPdf && product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-navy text-white text-xs font-medium uppercase tracking-wider px-4 py-2 rounded-md">
              {t("outOfStock")}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        {product.category && (
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.15em]">
            {product.category.title}
          </span>
        )}
        <h3 className="text-navy font-heading font-semibold mt-1 group-hover:text-teal transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-3 flex items-center gap-2">
          {isPdf ? (
            <span className="text-lg font-semibold text-green-600">
              {t("freeBadge")}
            </span>
          ) : (
            <>
              <span className="text-lg font-semibold text-navy">
                {product.price.toLocaleString("sr-RS")} RSD
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-gray-300 line-through">
                  {product.compareAtPrice.toLocaleString("sr-RS")} RSD
                </span>
              )}
            </>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={handleAddToCart}
          disabled={!isPdf && product.stock <= 0}
          className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium text-sm tracking-wide transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isPdf
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-navy text-white hover:bg-navy/90"
          }`}
        >
          {isPdf ? (
            <>
              <FileDown className="w-4 h-4" />
              {t("freeDownload")}
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              {t("addToCart")}
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
