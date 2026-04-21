import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/sanity";
import {
  validateCartItems,
  calcOrderTotals,
  type ClientCartItem,
} from "@/lib/order-validation";
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

    const totals = calcOrderTotals(validated, discountCode, shippingCost || 0);
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
        discountCode: discountCode || undefined,
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

