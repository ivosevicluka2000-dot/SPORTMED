"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { CartItem as CartItemType } from "@/types";

export default function CartItemRow({ item }: { item: CartItemType }) {
  const t = useTranslations("shop");
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4 py-4 border-b border-gray-50 last:border-0">
      {/* Image */}
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-ivory rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            No img
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-navy font-heading font-semibold truncate">{item.name}</h3>
        <p className="text-teal font-medium text-sm mt-1">
          {item.price.toLocaleString("sr-RS")} RSD
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center border border-gray-200 rounded-md">
            <button
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              className="p-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
              aria-label={t("decreaseQuantity")}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 text-xs font-medium min-w-[2rem] text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className="p-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              aria-label={t("increaseQuantity")}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => removeItem(item.productId)}
            className="p-1.5 text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
            aria-label={t("removeItem")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtotal */}
      <div className="text-right flex-shrink-0">
        <p className="text-navy font-medium text-sm">
          {(item.price * item.quantity).toLocaleString("sr-RS")} RSD
        </p>
      </div>
    </div>
  );
}
