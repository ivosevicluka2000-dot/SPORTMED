import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, isHoneypotTriggered } from "@/lib/rate-limit";
import { createLead } from "@/lib/leads";
import { sendProtocolEmail, type ProtocolBodyPart } from "@/lib/email";

const BODY_PARTS = [
  "skocni-zglob",
  "zglob-kolena",
  "kicmeni-stub",
  "zglob-ramena",
  "misici-zadnje-loze",
  "ostalo",
] as const;

const BODY_PART_LABELS: Record<(typeof BODY_PARTS)[number], { sr: string; en: string }> = {
  "skocni-zglob": { sr: "Skočni zglob", en: "Ankle" },
  "zglob-kolena": { sr: "Zglob kolena", en: "Knee" },
  "kicmeni-stub": { sr: "Kičmeni stub", en: "Spine" },
  "zglob-ramena": { sr: "Zglob ramena", en: "Shoulder" },
  "misici-zadnje-loze": { sr: "Mišići zadnje lože", en: "Hamstrings" },
  ostalo: { sr: "Ostalo", en: "Other" },
};

const contactSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z
      .union([z.string().email().max(254), z.literal("")])
      .optional(),
    phone: z
      .union([z.string().min(6).max(20), z.literal("")])
      .optional(),
    treatment: z.string().max(100).optional(),
    bodyPart: z.enum(BODY_PARTS).optional(),
    message: z.string().min(1).max(2000),
    problemDescription: z.string().max(2000).optional(),
    source: z
      .enum(["contact", "lead-capture-popup", "exit-intent"])
      .optional(),
    page: z.string().max(200).optional(),
    locale: z.string().max(10).optional(),
  })
  .refine(
    (d) =>
      d.source === "contact"
        ? typeof d.phone === "string" && d.phone.length >= 6
        : true,
    { path: ["phone"], message: "Phone is required" }
  );

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

    const description = data.problemDescription?.trim();
    const isLeadCapture =
      data.source === "lead-capture-popup" || data.source === "exit-intent";

    let leadMessage = data.message;
    if (isLeadCapture && data.bodyPart) {
      const lang = data.locale === "en" ? "en" : "sr";
      const label = BODY_PART_LABELS[data.bodyPart][lang];
      const header =
        lang === "en"
          ? `Free PDF protocol request — ${label}`
          : `Zahtev za besplatan PDF protokol — ${label}`;
      const descriptionLine = description
        ? `\n\n${lang === "en" ? "Description" : "Opis"}: ${description}`
        : "";
      leadMessage = `${header}${descriptionLine}`;
    }

    await createLead({
      source: data.source ?? "contact",
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      service: data.bodyPart ?? data.treatment,
      message: leadMessage,
      metadata: {
        page: data.page,
        locale: data.locale,
        userAgent: request.headers.get("user-agent") ?? undefined,
        referrer: request.headers.get("referer") ?? undefined,
      },
    });

    // Fire-and-forget: deliver the free PDF protocol when this is a
    // lead-capture submission with a valid email and a chosen body part.
    if (data.email && data.bodyPart && isLeadCapture) {
      void sendProtocolEmail({
        to: data.email,
        name: data.name,
        bodyPart: data.bodyPart as ProtocolBodyPart,
        locale: data.locale,
        problemDescription: description,
      });
    }

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
