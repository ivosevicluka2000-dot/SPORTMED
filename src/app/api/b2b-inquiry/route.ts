import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = b2bSchema.parse(body);

    // TODO: Send email via Resend/Nodemailer
    console.log("B2B inquiry:", data);

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
