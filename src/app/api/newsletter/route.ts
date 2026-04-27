import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp, isHoneypotTriggered } from "@/lib/rate-limit";
import { writeClient } from "@/lib/sanity";
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

    if (writeClient) {
      try {
        const existing = await writeClient.fetch<{ _id: string; unsubscribed?: boolean } | null>(
          `*[_type == "newsletterSubscriber" && lower(email) == $email][0]{_id, unsubscribed}`,
          { email }
        );
        if (existing?._id) {
          // Resubscribing an opt-out counts as a re-add; otherwise no-op.
          if (existing.unsubscribed) {
            await writeClient
              .patch(existing._id)
              .set({ unsubscribed: false, createdAt: new Date().toISOString() })
              .commit();
            isNewSubscriber = true;
          }
        } else {
          await writeClient.create({
            _type: "newsletterSubscriber",
            email,
            locale,
            unsubscribed: false,
            createdAt: new Date().toISOString(),
          });
          isNewSubscriber = true;
        }
      } catch (err) {
        console.error("[newsletter] Sanity upsert failed:", err);
        // Continue and respond success to avoid leaking errors to the client.
      }
    } else {
      console.warn(
        "[newsletter] SANITY_API_WRITE_TOKEN not configured; skipping persistence"
      );
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

    // Always return success — never reveal whether the email was already known.
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
