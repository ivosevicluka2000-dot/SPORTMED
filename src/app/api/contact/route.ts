import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, isHoneypotTriggered } from "@/lib/rate-limit";
import { createLead } from "@/lib/leads";
import {
  hasProtocolPdf,
  sendLeadNotificationEmail,
  sendProtocolEmail,
  type ProtocolBodyPart,
} from "@/lib/email";

export const runtime = "nodejs";

const BODY_PARTS = [
  "skocni-zglob",
  "zglob-kolena",
  "kicmeni-stub",
  "zglob-ramena",
  "misici-zadnje-loze",
  "ostalo",
] as const;

const PROTOCOL_BODY_PARTS = [
  "skocni-zglob",
  "zglob-kolena",
  "kicmeni-stub",
  "zglob-ramena",
  "misici-zadnje-loze",
] as const satisfies readonly (typeof BODY_PARTS)[number][];

const BODY_PART_LABELS: Record<(typeof BODY_PARTS)[number], { sr: string; en: string }> = {
  "skocni-zglob": { sr: "Skočni zglob", en: "Ankle" },
  "zglob-kolena": { sr: "Zglob kolena", en: "Knee" },
  "kicmeni-stub": { sr: "Kičmeni stub", en: "Spine" },
  "zglob-ramena": { sr: "Zglob ramena", en: "Shoulder" },
  "misici-zadnje-loze": { sr: "Mišići zadnje lože", en: "Hamstrings" },
  ostalo: { sr: "Ostalo", en: "Other" },
};

function isProtocolBodyPart(
  bodyPart: (typeof BODY_PARTS)[number] | undefined
): bodyPart is (typeof PROTOCOL_BODY_PARTS)[number] {
  return PROTOCOL_BODY_PARTS.some((part) => part === bodyPart);
}

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
    condition: z.string().max(2000).optional(),
    problemDescription: z.string().max(2000).optional(),
    source: z
      .enum(["contact", "lead-capture-popup", "exit-intent"])
      .default("contact"),
    page: z.string().max(200).optional(),
    locale: z.string().max(10).optional(),
  })
  .refine(
    (d) =>
      d.source === "contact"
        ? typeof d.phone === "string" && d.phone.length >= 6
        : true,
    { path: ["phone"], message: "Phone is required" }
  )
  .refine(
    (d) =>
      d.source === "contact"
        ? typeof d.email === "string" && d.email.length > 0
        : true,
    { path: ["email"], message: "Email is required" }
  )
  .refine(
    (d) => (d.source === "contact" ? Boolean(d.bodyPart) : true),
    { path: ["bodyPart"], message: "Body part is required" }
  )
  .refine(
    (d) =>
      d.source === "contact"
        ? typeof d.condition === "string" && d.condition.trim().length >= 5
        : true,
    { path: ["condition"], message: "Condition is required" }
  )
  .refine(
    (d) =>
      d.source === "lead-capture-popup" || d.source === "exit-intent"
        ? typeof d.email === "string" && d.email.length > 0 && Boolean(d.bodyPart)
        : true,
    { path: ["email"], message: "Email and body part are required" }
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
    const condition = data.condition?.trim();
    const isLeadCapture =
      data.source === "lead-capture-popup" || data.source === "exit-intent";
    const lang = data.locale === "en" ? "en" : "sr";
    const label = data.bodyPart ? BODY_PART_LABELS[data.bodyPart][lang] : undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const referrer = request.headers.get("referer") ?? undefined;
    const bodyPart = data.bodyPart as ProtocolBodyPart | undefined;
    const protocolBodyPart = isProtocolBodyPart(data.bodyPart)
      ? data.bodyPart
      : undefined;
    const protocolExists = protocolBodyPart
      ? await hasProtocolPdf(protocolBodyPart)
      : false;

    if (isLeadCapture && (!protocolBodyPart || !protocolExists)) {
      console.error("[contact] Requested popup protocol is not available:", bodyPart);
      return NextResponse.json(
        { error: "Protocol is not available" },
        { status: 400 }
      );
    }

    let leadMessage = data.message;
    if (isLeadCapture && data.bodyPart) {
      const header =
        lang === "en"
          ? `Free PDF protocol request — ${label}`
          : `Zahtev za besplatan PDF protokol — ${label}`;
      const descriptionLine = description
        ? `\n\n${lang === "en" ? "Description" : "Opis"}: ${description}`
        : "";
      leadMessage = `${header}${descriptionLine}`;
    } else if (data.source === "contact") {
      const lines = [
        lang === "en" ? "Contact form inquiry" : "Upit sa kontakt forme",
        label
          ? `${lang === "en" ? "Body part" : "Deo tela"}: ${label}`
          : undefined,
        condition
          ? `${lang === "en" ? "Condition" : "Stanje"}: ${condition}`
          : undefined,
        data.message
          ? `${lang === "en" ? "Message" : "Poruka"}: ${data.message}`
          : undefined,
      ].filter(Boolean);
      leadMessage = lines.join("\n\n");
    }

    const leadSaved = await createLead({
      source: data.source,
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      service: data.bodyPart ?? data.treatment,
      message: leadMessage,
      metadata: {
        page: data.page,
        locale: data.locale,
        userAgent,
        referrer,
      },
    });

    if (!leadSaved) {
      console.error("[contact] Lead was not saved; continuing with email delivery");
    }

    let protocolEmailSent: boolean | undefined;
    if (data.email && protocolBodyPart && protocolExists) {
      protocolEmailSent = await sendProtocolEmail({
        to: data.email,
        name: data.name,
        bodyPart: protocolBodyPart,
        locale: data.locale,
        problemDescription: description ?? condition,
      });

      if (!protocolEmailSent) {
        console.error("[contact] Protocol email failed:", {
          source: data.source,
          email: data.email,
          bodyPart: protocolBodyPart,
        });
      }
    }

    const adminNotified = await sendLeadNotificationEmail({
      source: data.source,
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      bodyPart,
      treatment: data.treatment,
      message: leadMessage,
      problemDescription: description ?? condition,
      page: data.page,
      locale: data.locale,
      userAgent,
      referrer,
      protocolEmailSent,
    });
    if (!adminNotified) {
      console.error("[contact] Admin notification email was not sent");
    }

    if (data.source === "contact" && !leadSaved && !adminNotified) {
      return NextResponse.json(
        { error: "Submission could not be delivered" },
        { status: 502 }
      );
    }

    if (isLeadCapture && !leadSaved && !adminNotified) {
      return NextResponse.json(
        { error: "Submission could not be delivered" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      leadSaved,
      protocolEmailSent,
      adminNotified,
    });
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
