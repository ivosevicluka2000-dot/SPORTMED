import { NextRequest, NextResponse } from "next/server";
import { authenticate, getOrderDetails } from "@/lib/raiaccept";
import { createAdminClient } from "@/lib/supabase/admin";

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
      .select("id, status, discount_code")
      .eq("rai_accept_order_id", orderIdentification)
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

    await admin
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderRow.id);

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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("RaiAccept webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
