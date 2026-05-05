import { NextRequest, NextResponse } from "next/server";
import {
  authenticate,
  getOrderDetails,
  isRaiAcceptConfigured,
} from "@/lib/raiaccept";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  if (!isRaiAcceptConfigured()) {
    return NextResponse.json(
      { error: "Payment service not configured" },
      { status: 503 }
    );
  }
  // Optional shared-secret check. RaiAccept does not document an HMAC
  // signature scheme, so when RAIACCEPT_WEBHOOK_SECRET is set we require it
  // as either ?secret=... or X-Webhook-Secret header. Skipped when unset.
  const expectedSecret = process.env.RAIACCEPT_WEBHOOK_SECRET;
  if (expectedSecret) {
    const provided =
      req.nextUrl.searchParams.get("secret") ||
      req.headers.get("x-webhook-secret");
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  try {
    const body = await req.json();
    const { orderIdentification } = body;
    if (!orderIdentification) {
      return NextResponse.json(
        { error: "Missing orderIdentification" },
        { status: 400 }
      );
    }

    const token = await authenticate();
    const orderDetails = await getOrderDetails(token, orderIdentification);

    const admin = createAdminClient();
    const { data: orderRow } = await admin
      .from("orders")
      .select(
        "id, order_number, status, discount_code, discount_amount, customer, items, subtotal, shipping_cost, total_amount, payment_method"
      )
      .eq("raiaccept_order_id", orderIdentification)
      .maybeSingle();
    if (!orderRow) {
      console.error("Order not found for RaiAccept ID:", orderIdentification);
      return NextResponse.json({ received: true });
    }

    let newStatus: string;
    switch (orderDetails.status) {
      case "PAID":
        newStatus = "confirmed";
        break;
      case "FAILED":
      case "CANCELED":
      case "ABANDONED":
      case "PARTIALLY_REFUNDED":
      case "FULLY_REFUNDED":
        newStatus = "cancelled";
        break;
      default:
        newStatus = "pending";
    }

    const { error: updateErr } = await admin
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderRow.id);
    if (updateErr) {
      console.error(
        `[raiaccept-webhook] Failed to update order ${orderRow.id} (raiaccept ${orderIdentification}) to ${newStatus}:`,
        updateErr
      );
    }

    // Bump discount usage exactly once per order on the transition to confirmed.
    if (
      newStatus === "confirmed" &&
      orderRow.status !== "confirmed" &&
      orderRow.discount_code
    ) {
      try {
        await admin.rpc("increment_discount_usage", {
          p_code: orderRow.discount_code,
        });
      } catch (err) {
        console.error("Failed to increment discount usage:", err);
      }
    }

    // Send order confirmation email exactly once on the PAID transition.
    if (newStatus === "confirmed" && orderRow.status !== "confirmed") {
      const customer = (orderRow.customer ?? {}) as {
        name?: string;
        email?: string;
        locale?: string;
      };
      if (customer.email) {
        void sendOrderConfirmation(
          {
            orderNumber: orderRow.order_number,
            locale: customer.locale === "en" ? "en" : "sr",
            customer: { name: customer.name ?? "", email: customer.email },
            items: (orderRow.items ?? []) as Array<{
              product_name: string;
              quantity: number;
              price: number;
            }>,
            subtotal: orderRow.subtotal,
            discountAmount: orderRow.discount_amount ?? 0,
            discountCode: orderRow.discount_code ?? null,
            shippingCost: orderRow.shipping_cost ?? 0,
            totalAmount: orderRow.total_amount,
            paymentMethod: orderRow.payment_method ?? "card",
            status: newStatus,
          },
          { notifyAdmin: true }
        ).catch((err) =>
          console.error(
            `[raiaccept-webhook] confirmation email failed for order ${orderRow.order_number}:`,
            err
          )
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("RaiAccept webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
