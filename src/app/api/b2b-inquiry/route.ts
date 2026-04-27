import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, isHoneypotTriggered } from "@/lib/rate-limit";
import { createLead } from "@/lib/leads";

const b2bSchema = z.object({
  organization: z.string().min(2).max(200),
  contactPerson: z.string().min(2).max(100),
  email: z.string().email().max(254),
  phone: z.string().min(6).max(20),
  sportType: z.string().max(100).optional(),
  teamSize: z.string().max(20).optional(),
  message: z.string().min(10).max(2000),
  selectedServices: z.array(z.string().max(100)).max(10).optional(),
  competitionLevel: z.string().max(50).optional(),
  seasonDuration: z.string().max(10).optional(),
  page: z.string().max(200).optional(),
  locale: z.string().max(10).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`b2b:${ip}`, 5, 60_000);
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

    const data = b2bSchema.parse(body);

    // Build a structured message body so the admin can see the full inquiry
    // context inside the Studio Lead document.
    const detailLines: string[] = [];
    if (data.organization) detailLines.push(`Organization: ${data.organization}`);
    if (data.sportType) detailLines.push(`Sport: ${data.sportType}`);
    if (data.teamSize) detailLines.push(`Team size: ${data.teamSize}`);
    if (data.competitionLevel) detailLines.push(`Level: ${data.competitionLevel}`);
    if (data.seasonDuration) detailLines.push(`Season: ${data.seasonDuration}`);
    if (data.selectedServices?.length)
      detailLines.push(`Services: ${data.selectedServices.join(", ")}`);
    detailLines.push("", data.message);

    await createLead({
      source: "b2b",
      name: data.contactPerson,
      phone: data.phone,
      email: data.email,
      service: data.selectedServices?.[0],
      message: detailLines.join("\n"),
      metadata: {
        page: data.page,
        locale: data.locale,
        userAgent: request.headers.get("user-agent") ?? undefined,
        referrer: request.headers.get("referer") ?? undefined,
      },
    });

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
