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
