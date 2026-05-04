import { createClient } from "@/lib/supabase/server";

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
 * Re-fetch authoritative price + stock for each cart item from Supabase.
 * Throws if any product is missing, out of stock, or quantity exceeds stock.
 */
export async function validateCartItems(
  items: ClientCartItem[],
  locale: string = "sr"
): Promise<ValidatedItem[]> {
  if (!items?.length) throw new Error("No items provided");
  if (items.length > 50) throw new Error("Too many items");

  const ids = Array.from(new Set(items.map((i) => i.productId)));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, stock, product_type, active")
    .in("id", ids);

  if (error) throw new Error("Failed to validate products");

  type Row = {
    id: string;
    name: Record<string, string> | null;
    price: number;
    stock: number;
    product_type: "physical" | "pdf";
    active: boolean;
  };
  const map = new Map<string, Row>();
  for (const r of (data as Row[]) ?? []) map.set(r.id, r);

  const pickName = (n: Record<string, string> | null): string => {
    if (!n) return "";
    return n[locale] ?? n.sr ?? n.en ?? "";
  };

  const validated: ValidatedItem[] = [];
  for (const item of items) {
    const product = map.get(item.productId);
    if (!product || !product.active) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    const name = pickName(product.name);
    if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
      throw new Error(`Invalid quantity for ${name}`);
    }
    const isPdf = product.product_type === "pdf" || product.price === 0;
    if (isPdf) {
      throw new Error(`Free downloads cannot be purchased: ${name}`);
    }
    if (product.stock <= 0) {
      throw new Error(`Out of stock: ${name}`);
    }
    if (item.quantity > product.stock) {
      throw new Error(`Only ${product.stock} of ${name} available`);
    }

    validated.push({
      productId: product.id,
      productName: name,
      quantity: item.quantity,
      price: product.price,
      stock: product.stock,
      isPdf,
    });
  }

  return validated;
}

/**
 * Compute order totals. Discount is resolved server-side via
 * `validateDiscount` in `@/lib/queries` and passed in here so this module
 * stays pure / synchronous.
 */
export function calcOrderTotals(
  items: ValidatedItem[],
  discount: { amount: number; percent: number } | null | undefined,
  shippingCost: number = 0
) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = Math.max(0, Math.min(discount?.amount ?? 0, subtotal));
  const discountPercent = discount?.percent ?? 0;
  const totalAmount = subtotal - discountAmount + shippingCost;
  return { subtotal, discountPercent, discountAmount, totalAmount };
}
