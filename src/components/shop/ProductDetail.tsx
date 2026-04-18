"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ShoppingCart, Minus, Plus, FileDown } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/types";
import ProductGallery from "./ProductGallery";

export default function ProductDetail({ product }: { product: Product }) {
  const t = useTranslations("shop");
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const isPdf = product.type === "pdf" || product.price === 0;

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100
        )
      : null;

  const handleAddToCart = () => {
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
      quantity,
      stock: product.stock,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Gallery */}
      <ProductGallery images={product.images || []} name={product.name} />

      {/* Info */}
      <div className="space-y-6">
        {product.category && (
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.15em]">
            {product.category.title}
          </span>
        )}

        <h1 className="text-3xl lg:text-4xl font-heading font-semibold text-navy">
          {product.name}
        </h1>

        {/* Price */}
        <div className="flex items-center gap-3">
          {isPdf ? (
            <span className="text-2xl font-semibold text-green-600">
              {t("freeBadge")}
            </span>
          ) : (
            <>
              <span className="text-2xl font-semibold text-navy">
                {product.price.toLocaleString("sr-RS")} RSD
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className="text-lg text-gray-300 line-through">
                    {product.compareAtPrice.toLocaleString("sr-RS")} RSD
                  </span>
                  <span className="bg-navy/5 text-navy text-xs font-medium px-2.5 py-1 rounded-md">
                    -{discount}%
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-gray-500 leading-relaxed">{product.description}</p>
        )}

        {/* Stock status — only for physical products */}
        {!isPdf && (
          <>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  product.stock > 0 ? "bg-green-500" : "bg-red-400"
                }`}
              />
              <span
                className={`text-xs font-medium uppercase tracking-wider ${
                  product.stock > 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {product.stock > 0
                  ? t("inStock", { count: product.stock })
                  : t("outOfStock")}
              </span>
            </div>

            <div className="h-px bg-gray-100" />
          </>
        )}

        {/* PDF download button */}
        {isPdf && (
          <>
            <div className="h-px bg-gray-100" />
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-6 rounded-md font-medium tracking-wide hover:bg-green-700 transition-colors cursor-pointer"
            >
              <FileDown className="w-5 h-5" />
              {t("freeDownload")}
            </button>
          </>
        )}

        {/* Quantity selector + Add to cart — only for physical products */}
        {!isPdf && product.stock > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-200 rounded-md">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                aria-label={t("decreaseQuantity")}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium min-w-[3rem] text-center text-sm">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                disabled={quantity >= product.stock}
                className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                aria-label={t("increaseQuantity")}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 bg-navy text-white py-3 px-6 rounded-md font-medium tracking-wide hover:bg-navy/90 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              {t("addToCart")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
