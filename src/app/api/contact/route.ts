import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, isHoneypotTriggered } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z
    .union([z.string().email().max(254), z.literal("")])
    .optional(),
  phone: z.string().min(6).max(20),
  treatment: z.string().max(100).optional(),
  message: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`contact:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
      );
    }

    const body = await request.json();

    if (isHoneypotTriggered(body)) {
      // Pretend success to avoid signaling bots
      return NextResponse.json({ success: true });
    }

    const data = contactSchema.parse(body);

    // TODO: Send email via Resend/Nodemailer
    console.log("Contact form submission:", data);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid form data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
