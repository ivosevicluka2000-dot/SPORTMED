import { NextRequest, NextResponse } from "next/server";
import { authenticate, createOrder, createPaymentSession } from "@/lib/raiaccept";
import { client } from "@/lib/sanity";
import {
  validateCartItems,
  calcOrderTotals,
  type ClientCartItem,
} from "@/lib/order-validation";

interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export async function POST(req: NextRequest) {
  if (
    !process.env.RAIACCEPT_API_USERNAME ||
    !process.env.RAIACCEPT_API_PASSWORD
  ) {
    return NextResponse.json(
      { error: "Payment service not configured" },
      { status: 503 }
    );
  }
  try {
    const body = await req.json();
    const {
      items,
      customer,
      shippingCost,
      discountCode,
      locale,
    }: {
      items: ClientCartItem[];
      customer: CustomerInput;
      shippingCost: number;
      discountCode?: string;
      locale?: string;
    } = body;

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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const localePrefix = locale && locale !== "sr" ? `/${locale}` : "";

    const nameParts = customer.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const raiItems = validated.map((item) => ({
      description: item.productName,
      numberOfItems: item.quantity,
      price: item.price,
    }));
    if (totals.discountAmount > 0) {
      raiItems.push({
        description: `Popust ${discountCode ?? ""} (-${totals.discountPercent}%)`,
        numberOfItems: 1,
        price: -totals.discountAmount,
      });
    }

    const orderParams = {
      merchantOrderReference: orderNumber,
      amount: totals.totalAmount,
      currency: "RSD",
      description: `Sport Care Med Order ${orderNumber}`,
      items: raiItems,
      customer: {
        firstName,
        lastName,
        email: customer.email,
        phone: customer.phone,
      },
      shippingAddress: {
        firstName,
        lastName,
        addressStreet1: customer.address,
        city: customer.city,
        postalCode: customer.postalCode,
        country: "SRB",
      },
      successUrl: `${baseUrl}${localePrefix}/prodavnica/potvrda?order=${orderNumber}`,
      failUrl: `${baseUrl}${localePrefix}/prodavnica/checkout?error=payment_failed&order=${orderNumber}`,
      cancelUrl: `${baseUrl}${localePrefix}/prodavnica/checkout?error=payment_cancelled&order=${orderNumber}`,
      notificationUrl: process.env.RAIACCEPT_NOTIFICATION_URL || undefined,
    };

    const token = await authenticate();
    const orderResponse = await createOrder(token, orderParams);
    const language = locale === "en" ? "en" : "sr";
    const sessionResponse = await createPaymentSession(
      token,
      orderResponse.orderIdentification,
      orderParams,
      language
    );

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
        paymentMethod: "card",
        raiAcceptOrderId: orderResponse.orderIdentification,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      paymentUrl: sessionResponse.paymentRedirectURL,
      orderNumber,
      orderIdentification: orderResponse.orderIdentification,
    });
  } catch (error) {
    console.error("RaiAccept payment session error:", error);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}

