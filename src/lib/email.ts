interface SendArgs {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{ filename: string; content: string }>;
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
export async function sendEmail({ to, subject, text, html, attachments }: SendArgs): Promise<boolean> {
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
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
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

// ---------------------------------------------------------------------------
// Order confirmation
// ---------------------------------------------------------------------------

interface OrderItemRow {
  product_name: string;
  quantity: number;
  price: number;
}

export interface OrderConfirmationInput {
  orderNumber: string;
  locale?: string; // "sr" | "en"
  customer: { name: string; email: string };
  items: OrderItemRow[];
  subtotal: number;
  discountAmount?: number;
  discountCode?: string | null;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: "card" | "cod" | string;
  status: string;
}

const T = {
  sr: {
    subject: (n: string) => `Potvrda porud\u017ebine ${n} \u2014 Sport Care Med`,
    greeting: (name: string) => `Po\u0161tovani ${name},`,
    intro:
      "Hvala na porud\u017ebini. U nastavku se nalaze detalji va\u0161e porud\u017ebine.",
    orderNumber: "Broj porud\u017ebine",
    status: "Status",
    paymentMethod: "Na\u010din pla\u0107anja",
    cod: "Pouze\u0107em",
    card: "Karticom",
    items: "Stavke",
    qty: "kol.",
    subtotal: "Me\u0111uzbir",
    discount: "Popust",
    shipping: "Dostava",
    total: "Ukupno",
    footer: "Tim Sport Care Med",
    rsd: "RSD",
  },
  en: {
    subject: (n: string) => `Order confirmation ${n} \u2014 Sport Care Med`,
    greeting: (name: string) => `Hello ${name},`,
    intro:
      "Thank you for your order. The details of your order are below.",
    orderNumber: "Order number",
    status: "Status",
    paymentMethod: "Payment method",
    cod: "Cash on delivery",
    card: "Card",
    items: "Items",
    qty: "qty",
    subtotal: "Subtotal",
    discount: "Discount",
    shipping: "Shipping",
    total: "Total",
    footer: "The Sport Care Med team",
    rsd: "RSD",
  },
} as const;

function fmt(n: number): string {
  return new Intl.NumberFormat("sr-RS").format(n);
}

/**
 * Sends an order confirmation email to the customer (and optionally a copy
 * to ADMIN_EMAIL). Safe to fire-and-forget: returns false on any failure
 * and never throws.
 */
export async function sendOrderConfirmation(
  order: OrderConfirmationInput,
  opts: { notifyAdmin?: boolean } = {}
): Promise<boolean> {
  try {
    const lang = order.locale === "en" ? "en" : "sr";
    const t = T[lang];
    const customerName = order.customer.name?.trim() || "";
    const itemRows = order.items
      .map(
        (i) =>
          `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${escapeHtml(
            i.product_name
          )} <span style="color:#888">(${t.qty} ${i.quantity})</span></td>` +
          `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${fmt(
            i.price * i.quantity
          )} ${t.rsd}</td></tr>`
      )
      .join("");
    const itemTextLines = order.items
      .map(
        (i) =>
          `  - ${i.product_name} x${i.quantity} = ${fmt(i.price * i.quantity)} ${t.rsd}`
      )
      .join("\n");
    const payLabel =
      order.paymentMethod === "card" ? t.card : t.cod;
    const discountRow =
      order.discountAmount && order.discountAmount > 0
        ? `<tr><td style="padding:4px 8px">${t.discount}${
            order.discountCode ? ` (${escapeHtml(order.discountCode)})` : ""
          }</td><td style="padding:4px 8px;text-align:right">-${fmt(
            order.discountAmount
          )} ${t.rsd}</td></tr>`
        : "";

    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#222;background:#fafafa;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:8px;padding:24px">
    <h2 style="margin:0 0 12px">Sport Care Med</h2>
    <p>${escapeHtml(t.greeting(customerName))}</p>
    <p>${t.intro}</p>
    <p><strong>${t.orderNumber}:</strong> ${escapeHtml(order.orderNumber)}<br/>
       <strong>${t.status}:</strong> ${escapeHtml(order.status)}<br/>
       <strong>${t.paymentMethod}:</strong> ${payLabel}</p>
    <h3 style="margin:16px 0 8px">${t.items}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}</table>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
      <tr><td style="padding:4px 8px">${t.subtotal}</td><td style="padding:4px 8px;text-align:right">${fmt(order.subtotal)} ${t.rsd}</td></tr>
      ${discountRow}
      <tr><td style="padding:4px 8px">${t.shipping}</td><td style="padding:4px 8px;text-align:right">${fmt(order.shippingCost)} ${t.rsd}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;border-top:2px solid #222">${t.total}</td><td style="padding:8px;text-align:right;font-weight:bold;border-top:2px solid #222">${fmt(order.totalAmount)} ${t.rsd}</td></tr>
    </table>
    <p style="margin-top:24px;color:#666">${t.footer}</p>
  </div>
</body></html>`;

    const text =
      `${t.greeting(customerName)}\n\n${t.intro}\n\n` +
      `${t.orderNumber}: ${order.orderNumber}\n` +
      `${t.status}: ${order.status}\n` +
      `${t.paymentMethod}: ${payLabel}\n\n` +
      `${t.items}:\n${itemTextLines}\n\n` +
      `${t.subtotal}: ${fmt(order.subtotal)} ${t.rsd}\n` +
      (order.discountAmount && order.discountAmount > 0
        ? `${t.discount}${order.discountCode ? ` (${order.discountCode})` : ""}: -${fmt(order.discountAmount)} ${t.rsd}\n`
        : "") +
      `${t.shipping}: ${fmt(order.shippingCost)} ${t.rsd}\n` +
      `${t.total}: ${fmt(order.totalAmount)} ${t.rsd}\n\n` +
      `${t.footer}`;

    const subject = t.subject(order.orderNumber);

    const sends: Promise<boolean>[] = [];
    if (order.customer.email) {
      sends.push(
        sendEmail({ to: order.customer.email, subject, text, html })
      );
    }
    if (opts.notifyAdmin) {
      const adminEmail = getAdminEmail();
      if (adminEmail) {
        sends.push(
          sendEmail({
            to: adminEmail,
            subject: `[admin] ${subject}`,
            text: `New order ${order.orderNumber} (${payLabel}, ${fmt(
              order.totalAmount
            )} RSD) from ${customerName} <${order.customer.email}>.`,
          })
        );
      }
    }
    const results = await Promise.all(sends);
    return results.every(Boolean);
  } catch (err) {
    console.error("[email] sendOrderConfirmation failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Lead capture: free PDF protocol
// ---------------------------------------------------------------------------

export type ProtocolBodyPart =
  | "skocni-zglob"
  | "zglob-kolena"
  | "kicmeni-stub"
  | "zglob-ramena"
  | "misici-zadnje-loze"
  | "ostalo";

const PROTOCOL_LABELS: Record<ProtocolBodyPart, { sr: string; en: string }> = {
  "skocni-zglob": { sr: "Skočni zglob", en: "Ankle" },
  "zglob-kolena": { sr: "Zglob kolena", en: "Knee" },
  "kicmeni-stub": { sr: "Kičmeni stub", en: "Spine" },
  "zglob-ramena": { sr: "Zglob ramena", en: "Shoulder" },
  "misici-zadnje-loze": { sr: "Mišići zadnje lože", en: "Hamstrings" },
  ostalo: { sr: "Ostalo", en: "Other" },
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sportcaremed.rs";

export function getProtocolPdfUrl(bodyPart: ProtocolBodyPart): string {
  return `${SITE_URL.replace(/\/$/, "")}/protocols/${bodyPart}.pdf`;
}

const PROTOCOL_T = {
  sr: {
    subject: (label: string) => `Vaš besplatan PDF protokol — ${label}`,
    greeting: (name: string) =>
      name ? `Poštovani ${name},` : "Poštovani,",
    introAttached:
      "Hvala što ste tražili besplatan protokol oporavka. PDF za izabranu povredu se nalazi u prilogu ovog emaila.",
    introLink:
      "Hvala što ste tražili besplatan protokol oporavka. PDF za izabranu povredu možete preuzeti na linku ispod.",
    backupLink: "Ako prilog ne radi, preuzmite PDF ovde:",
    cta: "Preuzmite PDF protokol",
    note: "Ako imate dodatnih pitanja, samo odgovorite na ovaj email — naš tim će vam se javiti.",
    footer: "Tim Sport Care Med",
    toldUs: "Naveli ste:",
  },
  en: {
    subject: (label: string) => `Your free PDF protocol — ${label}`,
    greeting: (name: string) => (name ? `Hi ${name},` : "Hi,"),
    introAttached:
      "Thanks for requesting the free recovery protocol. The PDF for your selected area is attached to this email.",
    introLink:
      "Thanks for requesting the free recovery protocol. Download the PDF for your selected area at the link below.",
    backupLink: "If the attachment doesn't open, you can also download it here:",
    cta: "Download the PDF protocol",
    note: "If you have any questions, just reply to this email — our team will get back to you.",
    footer: "The Sport Care Med team",
    toldUs: "You told us:",
  },
} as const;

/**
 * Send the free PDF protocol email to a lead. Fire-and-forget; never throws.
 * The PDF itself lives under /public/protocols/{bodyPart}.pdf.
 */
export async function sendProtocolEmail(args: {
  to: string;
  name?: string;
  bodyPart: ProtocolBodyPart;
  locale?: string;
  problemDescription?: string;
}): Promise<boolean> {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");

    const lang = args.locale === "en" ? "en" : "sr";
    const t = PROTOCOL_T[lang];
    const label = PROTOCOL_LABELS[args.bodyPart][lang];
    const pdfUrl = getProtocolPdfUrl(args.bodyPart);
    const name = (args.name ?? "").trim();
    const description = (args.problemDescription ?? "").trim();

    const pdfPath = join(process.cwd(), "public", "protocols", `${args.bodyPart}.pdf`);
    let pdfBase64: string | undefined;
    try {
      const buf = await readFile(pdfPath);
      pdfBase64 = buf.toString("base64");
    } catch (err) {
      console.error("[email] PDF not found, falling back to link:", pdfPath, err);
    }

    const intro = pdfBase64 ? t.introAttached : t.introLink;
    const subject = t.subject(label);

    const descriptionTextBlock = description
      ? `\n\n${t.toldUs}\n"${description}"`
      : "";
    const linkBlock = pdfBase64
      ? `\n\n${t.backupLink} ${pdfUrl}`
      : `\n\n${pdfUrl}`;
    const text =
      `${t.greeting(name)}\n\n${intro}${descriptionTextBlock}${linkBlock}\n\n${t.note}\n\n${t.footer}`;

    const descriptionHtmlBlock = description
      ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #0098b4;background:#f5fbfc;color:#444;font-style:italic"><div style="font-size:12px;color:#888;font-style:normal;margin-bottom:4px">${escapeHtml(t.toldUs)}</div>${escapeHtml(description)}</blockquote>`
      : "";
    const linkHtmlBlock = pdfBase64
      ? `<p style="color:#666;font-size:13px;margin:16px 0">${escapeHtml(t.backupLink)} <a href="${escapeHtml(pdfUrl)}" style="color:#0098b4">${escapeHtml(label)} PDF</a></p>`
      : `<p style="margin:24px 0"><a href="${escapeHtml(pdfUrl)}" style="display:inline-block;background:#0098b4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${escapeHtml(t.cta)} — ${escapeHtml(label)}</a></p>`;

    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#222;background:#fafafa;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:8px;padding:24px">
    <h2 style="margin:0 0 12px">Sport Care Med</h2>
    <p>${escapeHtml(t.greeting(name))}</p>
    <p>${escapeHtml(intro)}</p>
    ${descriptionHtmlBlock}
    ${linkHtmlBlock}
    <p style="color:#555;font-size:13px">${escapeHtml(t.note)}</p>
    <p style="margin-top:24px;color:#666">${escapeHtml(t.footer)}</p>
  </div>
</body></html>`;

    return await sendEmail({
      to: args.to,
      subject,
      text,
      html,
      ...(pdfBase64
        ? { attachments: [{ filename: `${args.bodyPart}.pdf`, content: pdfBase64 }] }
        : {}),
    });
  } catch (err) {
    console.error("[email] sendProtocolEmail failed:", err);
    return false;
  }
}
