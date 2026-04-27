import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateDiscount } from "@/lib/queries";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().min(1).max(40),
  subtotal: z.number().nonnegative().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`discount:${ip}`, 20, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { valid: false, reason: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
      );
    }

    const body = await req.json();
    const { code, subtotal = 0 } = schema.parse(body);

    const result = await validateDiscount(code, subtotal);

    // Don't leak full discount doc to the client. Only return what the UI needs.
    return NextResponse.json({
      valid: result.valid,
      reason: result.reason,
      percent: result.percent,
      amount: result.amount,
      code: result.discount?.code,
      type: result.discount?.type,
      value: result.discount?.value,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { valid: false, reason: "invalid_input" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { valid: false, reason: "server_error" },
      { status: 500 }
    );
  }
}
