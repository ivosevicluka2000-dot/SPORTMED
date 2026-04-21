import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, isHoneypotTriggered } from "@/lib/rate-limit";

const newsletterSchema = z.object({
  email: z.string().email().max(254),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`newsletter:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
      );
    }

    const body = await request.json();
    if (isHoneypotTriggered(body)) {
      return NextResponse.json({ success: true });
    }

    const data = newsletterSchema.parse(body);

    // TODO: Add to newsletter service
    console.log("Newsletter signup:", data);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
