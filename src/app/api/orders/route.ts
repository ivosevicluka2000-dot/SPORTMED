import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  validateCartItems,
  calcOrderTotals,
  type ClientCartItem,
} from "@/lib/order-validation";
import { validateDiscount } from "@/lib/queries";
import { rateLimit, getClientIp, isHoneypotTriggered } from "@/lib/rate-limit";

interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`orders:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
      );
    }

    const body = await req.json();
    if (isHoneypotTriggered(body)) {
      return NextResponse.json({ success: true });
    }
    const {
      items,
      customer,
      paymentMethod,
      shippingCost,
      discountCode,
      locale,
    }: {
      items: ClientCartItem[];
      customer: CustomerInput;
      paymentMethod: string;
      shippingCost: number;
      discountCode?: string;
      locale?: string;
    } = body;

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return NextResponse.json(
        { error: "Customer information is incomplete" },
        { status: 400 }
      );
    }

    let validated;
    try {
      validated = await validateCartItems(items, locale || "sr");
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid cart" },
        { status: 400 }
      );
    }

    const subtotal = validated.reduce((s, i) => s + i.price * i.quantity, 0);
    let discountResult = null as Awaited<ReturnType<typeof validateDiscount>> | null;
    let appliedCode: string | undefined;
    if (discountCode && discountCode.trim()) {
      discountResult = await validateDiscount(discountCode, subtotal);
      if (!discountResult.valid) {
        return NextResponse.json(
          { error: "Discount code is not valid", reason: discountResult.reason },
          { status: 400 }
        );
      }
      appliedCode = discountResult.discount?.code;
    }

    const totals = calcOrderTotals(
      validated,
      discountResult?.valid ? { amount: discountResult.amount, percent: discountResult.percent } : null,
      shippingCost || 0
    );
    const orderNumber = `SCM-${Date.now().toString(36).toUpperCase()}`;

    // Attach to logged-in user when available so order shows in dashboard.
    let userId: string | null = null;
    try {
      const auth = await createServerClient();
      const { data } = await auth.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      userId = null;
    }

    const admin = createAdminClient();
    const { error: insertErr } = await admin.from("orders").insert({
      order_number: orderNumber,
      user_id: userId,
      items: validated.map((item) => ({
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: totals.subtotal,
      discount_code: appliedCode ?? null,
      discount_amount: totals.discountAmount,
      shipping_cost: shippingCost || 0,
      total_amount: totals.totalAmount,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_address: customer.address,
      customer_city: customer.city,
      customer_postal_code: customer.postalCode,
      payment_method: paymentMethod || "cod",
      status: paymentMethod === "cod" ? "confirmed" : "pending",
    });

    if (insertErr) {
      console.error("Failed to insert order:", insertErr);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // For COD the sale is final immediately — bump discount usage now.
    // Card orders are bumped from the RaiAccept webhook on PAID.
    if (paymentMethod === "cod" && appliedCode) {
      try {
        await admin.rpc("increment_discount_usage", { p_code: appliedCode });
      } catch (err) {
        console.error("Failed to increment discount usage:", err);
      }
    }

    return NextResponse.json({
      orderNumber,
      totalAmount: totals.totalAmount,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
