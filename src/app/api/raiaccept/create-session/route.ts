import { NextRequest, NextResponse } from "next/server";
import { authenticate, createOrder, createPaymentSession } from "@/lib/raiaccept";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  validateCartItems,
  calcOrderTotals,
  type ClientCartItem,
} from "@/lib/order-validation";
import { validateDiscount } from "@/lib/queries";

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

    const subtotal = validated.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
    const discountResult = discountCode
      ? await validateDiscount(discountCode, subtotal)
      : null;
    const discount =
      discountResult && discountResult.valid
        ? { amount: discountResult.amount, percent: discountResult.percent }
        : null;
    const totals = calcOrderTotals(validated, discount, shippingCost || 0);
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

    {
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
        discount_code: discountCode || null,
        discount_amount: totals.discountAmount,
        shipping_cost: shippingCost || 0,
        total_amount: totals.totalAmount,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_address: customer.address,
        customer_city: customer.city,
        customer_postal_code: customer.postalCode,
        payment_method: "card",
        rai_accept_order_id: orderResponse.orderIdentification,
        status: "pending",
      });
      if (insertErr) {
        console.error("Failed to insert order:", insertErr);
      }
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

