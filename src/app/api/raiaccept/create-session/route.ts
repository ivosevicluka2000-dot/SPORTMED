import { NextRequest, NextResponse } from "next/server";
import { authenticate, createOrder, createPaymentSession } from "@/lib/raiaccept";
import { client } from "@/lib/sanity";

interface OrderItemInput {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

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
    const body = await req.json();
    const {
      items,
      customer,
      shippingCost,
      locale,
    }: {
      items: OrderItemInput[];
      customer: CustomerInput;
      shippingCost: number;
      locale?: string;
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    const totalAmount =
      items.reduce((sum, item) => sum + item.price * item.quantity, 0) +
      (shippingCost || 0);

    const orderNumber = `SCM-${Date.now().toString(36).toUpperCase()}`;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";
    const localePrefix = locale && locale !== "sr" ? `/${locale}` : "";

    // Split customer name into first/last
    const nameParts = customer.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const orderParams = {
      merchantOrderReference: orderNumber,
      amount: totalAmount,
      currency: "RSD",
      description: `Sport Care Med Order ${orderNumber}`,
      items: items.map((item) => ({
        description: item.productName,
        numberOfItems: item.quantity,
        price: item.price,
      })),
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

    // 1. Authenticate with RaiAccept
    const token = await authenticate();

    // 2. Create order entry
    const orderResponse = await createOrder(token, orderParams);

    // 3. Create payment session
    const language = locale === "en" ? "en" : "sr";
    const sessionResponse = await createPaymentSession(
      token,
      orderResponse.orderIdentification,
      orderParams,
      language
    );

    // 4. Create order in Sanity
    if (client) {
      await client.create({
        _type: "order",
        orderNumber,
        items: items.map((item) => ({
          _key: item.productId,
          product: { _type: "reference", _ref: item.productId },
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount,
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
