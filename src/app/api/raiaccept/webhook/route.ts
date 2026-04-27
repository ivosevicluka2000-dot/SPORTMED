import { NextRequest, NextResponse } from "next/server";
import { authenticate, getOrderDetails } from "@/lib/raiaccept";
import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

function getSanityWriteClient() {
  if (!/^[a-z0-9-]+$/.test(projectId)) return null;
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: process.env.SANITY_API_WRITE_TOKEN,
  });
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
    const { orderIdentification } = body;

    if (!orderIdentification) {
      return NextResponse.json(
        { error: "Missing orderIdentification" },
        { status: 400 }
      );
    }

    // Verify order status with RaiAccept API
    const token = await authenticate();
    const orderDetails = await getOrderDetails(token, orderIdentification);

    const sanityWriteClient = getSanityWriteClient();
    if (!sanityWriteClient) {
      return NextResponse.json({ received: true });
    }

    // Find the order by raiAcceptOrderId
    const orderDoc = await sanityWriteClient.fetch<{
      _id: string;
      status?: string;
      discountCode?: string;
    } | null>(
      `*[_type == "order" && raiAcceptOrderId == $raiOrderId][0]{
        _id, status, discountCode
      }`,
      { raiOrderId: orderIdentification }
    );

    if (!orderDoc?._id) {
      console.error("Order not found for RaiAccept ID:", orderIdentification);
      return NextResponse.json({ received: true });
    }

    // Map RaiAccept status to our order status
    let newStatus: string;
    switch (orderDetails.status) {
      case "PAID":
        newStatus = "confirmed";
        break;
      case "FAILED":
        newStatus = "cancelled";
        break;
      case "CANCELED":
      case "ABANDONED":
        newStatus = "cancelled";
        break;
      case "PARTIALLY_REFUNDED":
      case "FULLY_REFUNDED":
        newStatus = "cancelled";
        break;
      default:
        newStatus = "pending";
    }

    await sanityWriteClient
      .patch(orderDoc._id)
      .set({ status: newStatus })
      .commit();

    // Bump discount usage exactly once per order: only when transitioning
    // from a non-confirmed state to "confirmed".
    if (
      newStatus === "confirmed" &&
      orderDoc.status !== "confirmed" &&
      orderDoc.discountCode
    ) {
      try {
        const discountId = await sanityWriteClient.fetch<string | null>(
          `*[_type == "discountCode" && upper(code) == $code][0]._id`,
          { code: orderDoc.discountCode.toUpperCase() }
        );
        if (discountId) {
          await sanityWriteClient
            .patch(discountId)
            .inc({ usedCount: 1 })
            .commit();
        }
      } catch (err) {
        console.error("Failed to increment discount usedCount:", err);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("RaiAccept webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
