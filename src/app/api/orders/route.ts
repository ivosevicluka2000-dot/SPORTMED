import { NextRequest, NextResponse } from "next/server";
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
      paymentMethod,
      totalAmount,
      shippingCost,
    }: {
      items: OrderItemInput[];
      customer: CustomerInput;
      paymentMethod: string;
      totalAmount: number;
      shippingCost: number;
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return NextResponse.json(
        { error: "Customer information is incomplete" },
        { status: 400 }
      );
    }

    const orderNumber = `SCM-${Date.now().toString(36).toUpperCase()}`;

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
        paymentMethod: paymentMethod || "cod",
        status: paymentMethod === "cod" ? "confirmed" : "pending",
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ orderNumber });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
