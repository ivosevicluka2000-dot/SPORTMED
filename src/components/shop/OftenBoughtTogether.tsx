"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ShoppingCart, Plus } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/types";

export default function OftenBoughtTogether({
  currentProduct,
  relatedProducts,
}: {
  currentProduct: Product;
  relatedProducts: Product[];
}) {
  const t = useTranslations("shop");
  const { addItem } = useCart();

  const allProducts = [currentProduct, ...relatedProducts];
  const bundleTotal = allProducts.reduce((sum, p) => sum + p.price, 0);

  const handleAddAll = () => {
    allProducts.forEach((product) => {
      if (product.stock > 0 && product.price > 0) {
        addItem({
          productId: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0] || "",
          price: product.price,
          quantity: 1,
          stock: product.stock,
        });
      }
    });
  };

  const handleAddOne = (product: Product) => {
    if (product.stock <= 0 || product.price <= 0) return;
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

  if (relatedProducts.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      <h2 className="text-lg font-heading font-semibold text-navy mb-8 uppercase tracking-wider">
        {t("oftenBoughtTogether")}
      </h2>

      {/* Products row */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        {allProducts.map((product, index) => (
          <div key={product._id} className="flex items-center gap-4">
            {index > 0 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Plus className="w-4 h-4 text-gray-400" />
              </div>
            )}
            <div className="w-40 flex-shrink-0">
              <Link
                href={{
                  pathname: "/prodavnica/[slug]",
                  params: { slug: product.slug },
                }}
                className="group block bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow"
              >
                <div className="relative aspect-square bg-ivory overflow-hidden">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="160px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-medium text-navy line-clamp-2 group-hover:text-teal transition-colors">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-navy">
                    {product.price > 0
                      ? `${product.price.toLocaleString("sr-RS")} RSD`
                      : t("freeBadge")}
                  </p>
                </div>
              </Link>
              {product._id !== currentProduct._id && product.price > 0 && (
                <button
                  onClick={() => handleAddOne(product)}
                  disabled={product.stock <= 0}
                  className="mt-2 w-full text-xs text-center py-1.5 rounded-md border border-gray-200 text-navy hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-3 h-3 inline mr-1" />
                  {t("addToCart")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bundle total + Add all */}
      {bundleTotal > 0 && (
        <div className="flex flex-wrap items-center gap-6 p-5 bg-ivory rounded-xl border border-gray-100">
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              {t("totalBundle")}
            </span>
            <p className="text-xl font-heading font-semibold text-navy">
              {bundleTotal.toLocaleString("sr-RS")} RSD
            </p>
          </div>
          <button
            onClick={handleAddAll}
            className="flex items-center gap-2 bg-navy text-white py-3 px-6 rounded-md font-medium text-sm tracking-wide hover:bg-navy/90 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            {t("addAllToCart")}
          </button>
        </div>
      )}
    </section>
  );
}
