import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, isHoneypotTriggered } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, getAdminEmail } from "@/lib/email";

const newsletterSchema = z.object({
  email: z.string().email().max(254),
  locale: z.enum(["sr", "en"]).optional(),
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
    const email = data.email.trim().toLowerCase();
    const locale = data.locale ?? "sr";

    let isNewSubscriber = false;

    try {
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("newsletter_subscribers")
        .select("id, unsubscribed")
        .eq("email", email)
        .maybeSingle();
      if (existing) {
        if (existing.unsubscribed) {
          await admin
            .from("newsletter_subscribers")
            .update({ unsubscribed: false, locale })
            .eq("id", existing.id);
          isNewSubscriber = true;
        }
      } else {
        await admin
          .from("newsletter_subscribers")
          .insert({ email, locale, unsubscribed: false });
        isNewSubscriber = true;
      }
    } catch (err) {
      console.error("[newsletter] Supabase upsert failed:", err);
    }

    if (isNewSubscriber) {
      const adminEmail = getAdminEmail();
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `New subscriber: ${email}`,
          text: `New newsletter subscriber\n\nEmail: ${email}\nLocale: ${locale}\nDate: ${new Date().toISOString()}`,
        });
      }
    }

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
