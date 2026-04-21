import { client } from "@/lib/sanity";
import { getMockProducts } from "@/lib/mock-products";
import type { Product } from "@/types";

export interface ClientCartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface ValidatedItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // authoritative price from server
  stock: number;
  isPdf: boolean;
}

/**
 * Re-fetch authoritative price + stock for each cart item from the server.
 * Throws if any product is missing, out of stock, or quantity exceeds stock.
 * Mock product IDs are prefixed with "mock-" — those resolve from mock-products.
 */
export async function validateCartItems(
  items: ClientCartItem[],
  locale: string = "sr"
): Promise<ValidatedItem[]> {
  if (!items?.length) throw new Error("No items provided");
  if (items.length > 50) throw new Error("Too many items");

  // Split mock vs sanity ids
  const mockIds = items.filter((i) => i.productId.startsWith("mock-")).map((i) => i.productId);
  const sanityIds = items.filter((i) => !i.productId.startsWith("mock-")).map((i) => i.productId);

  const mockMap = new Map<string, Product>();
  if (mockIds.length) {
    const mockProducts = getMockProducts(locale);
    for (const p of mockProducts) {
      mockMap.set(p._id, p);
    }
  }

  const sanityMap = new Map<string, Product>();
  if (sanityIds.length && client) {
    const fetched = await client.fetch<Product[]>(
      `*[_type == "product" && _id in $ids]{
        _id,
        "name": coalesce(name[$locale], name.sr),
        "slug": slug.current,
        price,
        stock,
        type
      }`,
      { ids: sanityIds, locale }
    );
    for (const p of fetched) {
      sanityMap.set(p._id, p);
    }
  }

  const validated: ValidatedItem[] = [];
  for (const item of items) {
    const product = item.productId.startsWith("mock-")
      ? mockMap.get(item.productId)
      : sanityMap.get(item.productId);

    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
      throw new Error(`Invalid quantity for ${product.name}`);
    }
    const isPdf = product.type === "pdf" || product.price === 0;
    if (isPdf) {
      // PDFs cannot be checked out via paid checkout
      throw new Error(`Free downloads cannot be purchased: ${product.name}`);
    }
    if (product.stock <= 0) {
      throw new Error(`Out of stock: ${product.name}`);
    }
    if (item.quantity > product.stock) {
      throw new Error(`Only ${product.stock} of ${product.name} available`);
    }

    validated.push({
      productId: product._id,
      productName: product.name,
      quantity: item.quantity,
      price: product.price, // authoritative
      stock: product.stock,
      isPdf,
    });
  }

  return validated;
}

const DISCOUNT_CODES: Record<string, number> = {
  SPORT10: 10,
  SPORT20: 20,
  DOBRODOSLI: 15,
};

export function getDiscountPercent(code?: string | null): number {
  if (!code) return 0;
  return DISCOUNT_CODES[code.trim().toUpperCase()] ?? 0;
}

export function calcOrderTotals(
  items: ValidatedItem[],
  discountCode?: string | null,
  shippingCost: number = 0
) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountPercent = getDiscountPercent(discountCode);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const totalAmount = subtotal - discountAmount + shippingCost;
  return { subtotal, discountPercent, discountAmount, totalAmount };
}
