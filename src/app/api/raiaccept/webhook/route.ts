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
    const orderId = await sanityWriteClient.fetch(
      `*[_type == "order" && raiAcceptOrderId == $raiOrderId][0]._id`,
      { raiOrderId: orderIdentification }
    );

    if (!orderId) {
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
      .patch(orderId)
      .set({ status: newStatus })
      .commit();

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("RaiAccept webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
