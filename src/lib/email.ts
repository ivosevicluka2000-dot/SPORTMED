interface SendArgs {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Minimal admin notification helper. Uses the Resend HTTP API when
 * `RESEND_API_KEY` is configured. No-ops (and logs) otherwise so local
 * development and previews don't error out.
 *
 * Required env vars in production:
 *   RESEND_API_KEY  — Resend API key
 *   EMAIL_FROM      — verified sender, e.g. "Sport Care Med <noreply@…>"
 *   ADMIN_EMAIL     — recipient inbox for notifications
 */
export async function sendEmail({ to, subject, text, html }: SendArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info("[email] not configured; would send:", { to, subject });
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html: html ?? `<pre style="font-family:monospace">${escapeHtml(text)}</pre>`,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend error:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}

export function getAdminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL || undefined;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
