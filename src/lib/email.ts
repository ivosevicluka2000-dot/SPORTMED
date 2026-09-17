interface SendArgs {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{ filename: string; content: string }>;
  idempotencyKey?: string;
}

export function getEmailConfigStatus() {
  return {
    resendApiKeyConfigured: Boolean(process.env.RESEND_API_KEY),
    emailFromConfigured: Boolean(process.env.EMAIL_FROM),
    adminEmailConfigured: Boolean(process.env.ADMIN_EMAIL),
  };
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
export async function sendEmail({ to, subject, text, html, attachments, idempotencyKey }: SendArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("[email] not configured; would send:", {
      config: getEmailConfigStatus(),
    });
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html: html ?? emailLayout({ title: subject, content: `<p style="margin:0;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(text)}</p>` }),
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

// Table-based shell with inline styles for desktop and mobile email clients.
// Callers escape dynamic values before passing the trusted HTML content.
function emailLayout({ title, content, locale = "en", preheader = title }: {
  title: string;
  content: string;
  locale?: "sr" | "en";
  preheader?: string;
}): string {
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#eef1f2;color:#3e4f55;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef1f2"><tr><td align="center" style="padding:28px 12px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
<tr><td bgcolor="#4f636a" style="padding:24px;border-radius:16px 16px 0 0;border-bottom:4px solid #9ecde8"><p style="margin:0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:34px">Sport Care <span style="color:#bfdfee">&amp;</span> Med</p></td></tr>
<tr><td bgcolor="#ffffff" style="padding:28px 24px;border-radius:0 0 16px 16px;font-size:15px;line-height:25px;overflow-wrap:anywhere">
<h1 style="margin:0 0 24px;color:#4f636a;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:36px;font-weight:normal">${escapeHtml(title)}</h1>
${content}
</td></tr>
<tr><td align="center" style="padding:20px 12px;color:#64748b;font-size:12px;line-height:20px">Sport Care &amp; Med<br>Vojvode Mišića 21 A, Šabac<br><a href="mailto:info@sportcaremed.com" style="color:#4f636a;text-decoration:underline">info@sportcaremed.com</a> &nbsp;·&nbsp; <a href="tel:+381691982215" style="color:#4f636a;text-decoration:none">+381 69 1982215</a></td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}

export interface RehabAppointmentReminderInput {
  to: string;
  patientName: string;
  workspaceName: string;
  startsAt: string;
}

export async function sendRehabAppointmentReminder(
  input: RehabAppointmentReminderInput
): Promise<boolean> {
  const formatted = new Intl.DateTimeFormat("sr-RS", {
    timeZone: "Europe/Belgrade",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(input.startsAt));
  const safeName = escapeHtml(input.patientName);
  const safeWorkspace = escapeHtml(input.workspaceName);
  const safeDate = escapeHtml(formatted);
  const subject = `Podsetnik za termin — ${input.workspaceName}`;
  const text =
    `Poštovani ${input.patientName},\n\n` +
    `podsećamo vas da imate zakazan termin u ${input.workspaceName}:\n` +
    `${formatted}.\n\n` +
    `Ako niste u mogućnosti da dođete, molimo vas da nas obavestite.\n\n` +
    `Sport Care & Med`;
  const html = emailLayout({ title: "Podsetnik za termin", locale: "sr", content: `
    <p style="margin:0 0 14px;color:#4f636a">Poštovani ${safeName},</p>
    <p style="line-height:1.6">Podsećamo vas da imate zakazan termin u <strong>${safeWorkspace}</strong>.</p>
    <div style="margin:20px 0;padding:16px;border-left:4px solid #9ecde8;background:#f1f8fc;font-size:18px;font-weight:600;color:#334155">${safeDate}</div>
    <p style="line-height:1.6;color:#475569">Ako niste u mogućnosti da dođete, molimo vas da nas obavestite.</p>
    <p style="margin-top:24px;color:#64748b">Sport Care & Med</p>
  ` });

  return sendEmail({ to: input.to, subject, text, html });
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

    const html = emailLayout({ title: lang === "en" ? "Order confirmation" : "Potvrda porudžbine", locale: lang, preheader: t.subject(order.orderNumber), content: `
    <p>${escapeHtml(t.greeting(customerName))}</p>
    <p>${t.intro}</p>
    <p style="padding:16px;background:#f1f8fc;border-left:4px solid #9ecde8"><strong>${t.orderNumber}:</strong> ${escapeHtml(order.orderNumber)}<br/>
       <strong>${t.status}:</strong> ${escapeHtml(order.status)}<br/>
       <strong>${t.paymentMethod}:</strong> ${payLabel}</p>
    <h3 style="margin:16px 0 8px">${t.items}</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${itemRows}</table>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px">
      <tr><td style="padding:4px 8px">${t.subtotal}</td><td style="padding:4px 8px;text-align:right">${fmt(order.subtotal)} ${t.rsd}</td></tr>
      ${discountRow}
      <tr><td style="padding:4px 8px">${t.shipping}</td><td style="padding:4px 8px;text-align:right">${fmt(order.shippingCost)} ${t.rsd}</td></tr>
      <tr><td style="padding:12px 8px;font-weight:bold;border-top:2px solid #9ecde8;background:#f1f8fc">${t.total}</td><td style="padding:12px 8px;text-align:right;font-weight:bold;border-top:2px solid #9ecde8;background:#f1f8fc">${fmt(order.totalAmount)} ${t.rsd}</td></tr>
    </table>
    <p style="margin-top:24px;color:#666">${t.footer}</p>
    ` });

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

type ProtocolLocale = "sr" | "en";

const PROTOCOL_LABELS: Record<ProtocolBodyPart, { sr: string; en: string }> = {
  "skocni-zglob": { sr: "Skočni zglob", en: "Ankle" },
  "zglob-kolena": { sr: "Zglob kolena", en: "Knee" },
  "kicmeni-stub": { sr: "Kičmeni stub", en: "Spine" },
  "zglob-ramena": { sr: "Zglob ramena", en: "Shoulder" },
  "misici-zadnje-loze": { sr: "Mišići zadnje lože", en: "Hamstrings" },
  ostalo: { sr: "Ostalo", en: "Other" },
};

const PROTOCOL_FILES: Record<ProtocolLocale, Record<ProtocolBodyPart, string>> = {
  sr: {
    "skocni-zglob": "skocni-zglob.pdf",
    "zglob-kolena": "zglob-kolena.pdf",
    "kicmeni-stub": "kicmeni-stub.pdf",
    "zglob-ramena": "zglob-ramena.pdf",
    "misici-zadnje-loze": "istegnuce-zadnje-loze.pdf",
    ostalo: "ostalo.pdf",
  },
  en: {
    "skocni-zglob": "ankle-sprain.pdf",
    "zglob-kolena": "knee-pain.pdf",
    "kicmeni-stub": "lower-back-pain.pdf",
    "zglob-ramena": "shoulder-pain.pdf",
    "misici-zadnje-loze": "hamstring-strain.pdf",
    ostalo: "other.pdf",
  },
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sportcaremed.rs";

function getProtocolLocale(locale?: string): ProtocolLocale {
  return locale === "en" ? "en" : "sr";
}

export function getProtocolPdfUrl(bodyPart: ProtocolBodyPart, locale?: string): string {
  const lang = getProtocolLocale(locale);
  return `${SITE_URL.replace(/\/$/, "")}/protocols/${lang}/${PROTOCOL_FILES[lang][bodyPart]}`;
}

async function getProtocolPdfPath(bodyPart: ProtocolBodyPart, locale?: string): Promise<string> {
  const { join } = await import("node:path");
  const lang = getProtocolLocale(locale);
  return join(process.cwd(), "public", "protocols", lang, PROTOCOL_FILES[lang][bodyPart]);
}

export async function hasProtocolPdf(bodyPart: ProtocolBodyPart, locale?: string): Promise<boolean> {
  try {
    const { access } = await import("node:fs/promises");
    await access(await getProtocolPdfPath(bodyPart, locale));
    return true;
  } catch {
    return false;
  }
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

export interface LeadNotificationInput {
  source: "contact" | "b2b" | "lead-capture-popup" | "exit-intent";
  name: string;
  email?: string;
  phone?: string;
  bodyPart?: ProtocolBodyPart;
  treatment?: string;
  message: string;
  problemDescription?: string;
  page?: string;
  locale?: string;
  userAgent?: string;
  referrer?: string;
  protocolEmailSent?: boolean;
}

export async function sendLeadNotificationEmail(input: LeadNotificationInput): Promise<boolean> {
  try {
    const adminEmail = getAdminEmail();
    if (!adminEmail) {
      console.info("[email] ADMIN_EMAIL not configured; skipping lead notification");
      return false;
    }

    const lang = input.locale === "en" ? "en" : "sr";
    const bodyPartLabel = input.bodyPart
      ? PROTOCOL_LABELS[input.bodyPart][lang]
      : undefined;
    const sourceLabel =
      input.source === "contact"
        ? "Contact form"
        : input.source === "b2b"
          ? "B2B inquiry"
          : input.source === "exit-intent"
            ? "Exit intent popup"
            : "Lead capture popup";
    const protocolStatus =
      input.protocolEmailSent === undefined
        ? "No protocol email sent"
        : input.protocolEmailSent
          ? "Protocol email sent"
          : "Protocol email failed";

    const details = [
      ["Source", sourceLabel],
      ["Name", input.name],
      ["Email", input.email || "-"],
      ["Phone", input.phone || "-"],
      [input.source === "b2b" ? "Service" : "Body part / protocol", bodyPartLabel ?? input.treatment ?? "-"],
      ...(input.source === "b2b" ? [] : [["Protocol delivery", protocolStatus] as const]),
      ["Message", input.message],
      ["Problem description", input.problemDescription || "-"],
      ["Page", input.page || "-"],
      ["Locale", input.locale || "-"],
      ["Referrer", input.referrer || "-"],
      ["User agent", input.userAgent || "-"],
      ["Date", new Date().toISOString()],
    ] as const;

    const text = details
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n\n");
    const rows = details
      .map(
        ([label, value]) =>
          `<tr><th scope="row" style="vertical-align:top;text-align:left;padding:10px 8px;border-bottom:1px solid #e2e8f0;color:#4f636a;width:32%;background:#f1f8fc">${escapeHtml(
            label
          )}</th><td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word">${escapeHtml(
            value
          )}</td></tr>`
      )
      .join("");
    const html = emailLayout({ title: "New inquiry", preheader: `${sourceLabel} — ${input.name}`, content: `
    <p style="margin:0 0 20px;color:#64748b">${escapeHtml(sourceLabel)}</p>
    <table style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:14px;line-height:22px">${rows}</table>
    ` });

    return await sendEmail({
      to: adminEmail,
      subject: `New lead: ${sourceLabel} — ${input.name}`,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] sendLeadNotificationEmail failed:", err);
    return false;
  }
}

/**
 * Send the free PDF protocol email to a lead. Returns false on failure and
 * never throws. PDFs live under /public/protocols/{locale}/ and are resolved
 * from the submitted locale plus the selected body part.
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

    const lang = getProtocolLocale(args.locale);
    const t = PROTOCOL_T[lang];
    const label = PROTOCOL_LABELS[args.bodyPart][lang];
    const pdfUrl = getProtocolPdfUrl(args.bodyPart, args.locale);
    const name = (args.name ?? "").trim();
    const description = (args.problemDescription ?? "").trim();

    const pdfPath = await getProtocolPdfPath(args.bodyPart, args.locale);
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
      ? `<blockquote style="margin:20px 0;padding:16px;border-left:4px solid #9ecde8;background:#f1f8fc;color:#4f636a;font-style:italic;white-space:pre-wrap"><div style="font-size:12px;color:#64748b;font-style:normal;margin-bottom:4px">${escapeHtml(t.toldUs)}</div>${escapeHtml(description)}</blockquote>`
      : "";
    const linkHtmlBlock = pdfBase64
      ? `<p style="color:#64748b;font-size:13px;margin:20px 0">${escapeHtml(t.backupLink)} <a href="${escapeHtml(pdfUrl)}" style="color:#4f636a;text-decoration:underline">${escapeHtml(label)} PDF</a></p>`
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0"><tr><td align="center" bgcolor="#4f636a" style="border-radius:8px;mso-padding-alt:14px 20px"><a href="${escapeHtml(pdfUrl)}" style="display:block;color:#fff;text-decoration:none;padding:14px 20px;font-weight:bold">${escapeHtml(t.cta)} — ${escapeHtml(label)}</a></td></tr></table>`;

    const html = emailLayout({ title: lang === "en" ? "Your recovery protocol" : "Vaš protokol oporavka", locale: lang, preheader: subject, content: `
    <p style="margin:0 0 20px;padding:12px 16px;background:#f1f8fc;color:#4f636a;font-weight:bold;border-radius:8px">PDF &nbsp;·&nbsp; ${escapeHtml(label)}</p>
    <p>${escapeHtml(t.greeting(name))}</p>
    <p>${escapeHtml(intro)}</p>
    ${descriptionHtmlBlock}
    ${linkHtmlBlock}
    <p style="color:#555;font-size:13px">${escapeHtml(t.note)}</p>
    <p style="margin-top:24px;color:#666">${escapeHtml(t.footer)}</p>
    ` });

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
