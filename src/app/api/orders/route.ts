import { NextRequest, NextResponse } from "next/server";
import { client, writeClient } from "@/lib/sanity";
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

    // Resolve discount server-side. Reject the request if the customer
    // submitted a code that no longer validates (expired, used up, etc.).
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

    if (client) {
      await client.create({
        _type: "order",
        orderNumber,
        items: validated.map((item, idx) => ({
          _key: `${item.productId}-${idx}`,
          product: item.productId.startsWith("mock-")
            ? undefined
            : { _type: "reference", _ref: item.productId },
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal: totals.subtotal,
        discountCode: appliedCode,
        discountAmount: totals.discountAmount,
        totalAmount: totals.totalAmount,
        shippingCost: shippingCost || 0,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          postalCode: customer.postalCode,
        },
        paymentMethod: paymentMethod || "cod",
        status: paymentMethod === "cod" ? "confirmed" : "pending",
        createdAt: new Date().toISOString(),
      });
    }

    // For COD orders the sale is final at this point — bump the discount
    // usage counter immediately. Card orders are bumped from the
    // RaiAccept webhook once the payment is confirmed.
    if (
      paymentMethod === "cod" &&
      discountResult?.valid &&
      discountResult.discount?._id &&
      writeClient
    ) {
      try {
        await writeClient
          .patch(discountResult.discount._id)
          .inc({ usedCount: 1 })
          .commit();
      } catch (err) {
        console.error("Failed to increment discount usedCount:", err);
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

