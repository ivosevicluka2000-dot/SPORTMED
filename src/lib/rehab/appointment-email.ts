export type AppointmentEmailEvent = "created" | "updated" | "scheduled" | "completed" | "cancelled" | "deleted" | "reminder";

export interface AppointmentEmailPayload {
  patientName: string;
  workspaceName: string;
  locale: "sr" | "en";
  startsAt: string;
  previousStartsAt?: string | null;
  durationMinutes: number;
  appointmentStatus: "scheduled" | "completed" | "cancelled";
}

export interface AppointmentEmailBrand {
  logoUrl?: string | null;
  address?: string;
  contactUrl?: string;
  contactLabel?: string;
}

const copy = {
  sr: {
    created: ["Termin je zakazan", "Sve je spremno. Vidimo se u zakazano vreme."],
    updated: ["Izmena termina", "U nastavku su novi podaci o tvom terminu."],
    scheduled: ["Termin je ponovo zakazan", "Tvoj termin je ponovo aktivan. Vidimo se!"],
    completed: ["Hvala na dolasku", "Tvoj termin je završen."],
    cancelled: ["Termin je otkazan", "Nije potrebno da dolaziš na ovaj termin."],
    deleted: ["Termin je uklonjen", "Ovaj termin više nije u rasporedu. Nije potrebno da dolaziš."],
    reminder: ["Podsetnik za termin", "Vidimo se uskoro. Ovo su detalji tvog termina."],
    moved: "Termin je pomeren", hello: "Zdravo", date: "Datum", time: "Vreme", duration: "Trajanje",
    before: "Prethodno", current: "Novi termin", details: "Detalji termina", inactive: "Prethodni termin",
    location: "Lokacija", calendar: "Dodaj u Google kalendar", contact: "Kontaktiraj nas",
    help: "Treba ti pomoć ili drugi termin?", clubHelp: "Za pitanja ili promenu termina kontaktiraj svoj klub.",
    calendarUpdate: "Ako je termin već u tvom kalendaru, ažuriraj ga i tamo.",
    calendarRemove: "Ako je termin u tvom kalendaru, ukloni ga i tamo.",
    timezone: "Vreme u Beogradu", footer: "Obaveštenje o tvom terminu",
  },
  en: {
    created: ["Your appointment is booked", "You're all set. See you at your appointment."],
    updated: ["Appointment updated", "Here are the updated details of your appointment."],
    scheduled: ["Your appointment is booked again", "Your appointment is active again. See you soon!"],
    completed: ["Thank you for coming", "Your appointment is complete."],
    cancelled: ["Appointment cancelled", "You do not need to attend this appointment."],
    deleted: ["Appointment removed", "This appointment is no longer on the schedule. You do not need to attend."],
    reminder: ["Appointment reminder", "See you soon. Here are your appointment details."],
    moved: "Appointment rescheduled", hello: "Hello", date: "Date", time: "Time", duration: "Duration",
    before: "Previously", current: "New appointment", details: "Appointment details", inactive: "Previous appointment",
    location: "Location", calendar: "Add to Google Calendar", contact: "Contact us",
    help: "Need help or a different time?", clubHelp: "For questions or appointment changes, contact your club.",
    calendarUpdate: "If you already saved this appointment, update it in your calendar too.",
    calendarRemove: "If you saved this appointment, remove it from your calendar too.",
    timezone: "Belgrade time", footer: "Your appointment notification",
  },
} as const;

function escape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function httpsUrl(value?: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : null; } catch { return null; }
}

// Scheduling details only: patient names and clinical data never enter calendar URLs.
export function appointmentCalendarUrl(input: AppointmentEmailPayload, address?: string) {
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const start = new Date(input.startsAt);
  const end = new Date(start.getTime() + input.durationMinutes * 60_000);
  const params = new URLSearchParams({ action: "TEMPLATE", text: input.workspaceName,
    dates: `${stamp(start)}/${stamp(end)}`, ctz: "Europe/Belgrade", ...(address ? { location: address } : {}) });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// Table layout and inline styles keep the essential design intact in email clients.
export function buildAppointmentEmail(event: AppointmentEmailEvent, input: AppointmentEmailPayload, brand: AppointmentEmailBrand = {}) {
  const t = copy[input.locale];
  const locale = input.locale === "en" ? "en-GB" : "sr-Latn-RS";
  const format = (value: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Belgrade", ...options,
  }).format(new Date(value));
  const longDate = (value: string) => format(value, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const time = (value: string) => format(value, { hour: "2-digit", minute: "2-digit", hour12: false });
  const shortDate = format(input.startsAt, { day: "numeric", month: "short" });
  const end = new Date(new Date(input.startsAt).getTime() + input.durationMinutes * 60_000).toISOString();
  const crossesDay = longDate(end) !== longDate(input.startsAt);
  const timeRange = `${time(input.startsAt)}–${time(end)}${crossesDay ? ` (${longDate(end)})` : ""}`;
  const moved = event === "updated" && Boolean(input.previousStartsAt) &&
    new Date(input.previousStartsAt!).getTime() !== new Date(input.startsAt).getTime();
  const inactive = event === "cancelled" || event === "deleted" || input.appointmentStatus === "cancelled";
  const active = !inactive && event !== "completed" && input.appointmentStatus === "scheduled";
  const [baseTitle, intro] = t[event];
  const title = moved ? t.moved : baseTitle;
  const accent = inactive ? "#ae4048" : event === "updated" ? "#946416" : "#237c70";
  const tint = inactive ? "#fff2f2" : event === "updated" ? "#fff8e9" : "#edf7f3";
  const logo = httpsUrl(brand.logoUrl);
  const contactUrl = httpsUrl(brand.contactUrl);
  const calendar = active && event !== "updated" ? appointmentCalendarUrl(input, brand.address) : null;
  const calendarNote = inactive ? t.calendarRemove : event === "updated" || event === "scheduled" ? t.calendarUpdate : null;
  const previous = moved ? `${longDate(input.previousStartsAt!)} · ${time(input.previousStartsAt!)}` : null;
  const detailTitle = inactive ? t.inactive : moved ? t.current : t.details;
  const help = contactUrl ? t.help : t.clubHelp;
  const lines = [
    `${t.hello} ${input.patientName},`, "", title, intro, "", input.workspaceName,
    ...(previous ? [`${t.before}: ${previous}`, t.current] : []),
    `${t.date}: ${longDate(input.startsAt)}`, `${t.time}: ${timeRange} (${t.timezone})`,
    `${t.duration}: ${input.durationMinutes} min`, ...(brand.address ? [`${t.location}: ${brand.address}`] : []),
    ...(calendar ? ["", `${t.calendar}: ${calendar}`] : []), ...(calendarNote ? [calendarNote] : []),
    "", help, ...(contactUrl ? [`${t.contact}: ${contactUrl}`, ...(brand.contactLabel ? [brand.contactLabel] : [])] : []),
  ];
  const text = lines.join("\n");
  const preheader = `${intro} ${shortDate}, ${timeRange}.`;
  return {
    subject: `${title} — ${shortDate}, ${time(input.startsAt)} · ${input.workspaceName}`,
    text,
    html: `<!doctype html>
<html lang="${input.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escape(title)}</title></head>
<body style="margin:0;padding:0;background-color:#f2f5f4;color:#233c38;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escape(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f2f5f4"><tr><td align="center" style="padding:28px 12px">
<!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td style="padding:0 12px 20px;text-align:center">${logo ? `<img src="${escape(logo)}" width="144" alt="${escape(input.workspaceName)}" style="display:block;margin:0 auto 12px;width:144px;max-width:100%;height:auto;border:0">` : ""}<p style="margin:0;color:#49635b;font-size:14px;font-weight:bold;line-height:22px">${escape(input.workspaceName)}</p></td></tr>
<tr><td bgcolor="#ffffff" style="border:1px solid #dce7e2;border-top:5px solid ${accent};border-radius:16px;padding:28px 24px">
<p style="margin:0 0 14px;font-size:15px;line-height:24px;color:#61746d">${escape(t.hello)} ${escape(input.patientName)},</p>
<h1 style="margin:0 0 12px;font-size:28px;line-height:36px;letter-spacing:-0.5px;color:${accent}">${escape(title)}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:25px;color:#49635b">${escape(intro)}</p>
${previous ? `<p style="margin:0 0 16px;font-size:14px;line-height:23px;color:#6b766f">${escape(t.before)}<br><span style="text-decoration:line-through">${escape(previous)}</span></p>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${tint}" style="border-radius:12px"><tr><td style="padding:20px">
<p style="margin:0 0 10px;font-size:12px;line-height:18px;letter-spacing:1px;text-transform:uppercase;color:${accent};font-weight:bold">${escape(detailTitle)}</p>
<p style="margin:0 0 6px;font-size:18px;line-height:27px;color:#233c38;font-weight:bold">${escape(longDate(input.startsAt))}</p>
<p style="margin:0 0 7px;font-size:30px;line-height:39px;color:#233c38;font-weight:bold">${escape(timeRange)}</p>
<p style="margin:0;font-size:13px;line-height:21px;color:#61746d">${input.durationMinutes} min &nbsp;·&nbsp; ${escape(t.timezone)}</p>
${brand.address ? `<p style="margin:16px 0 0;padding-top:14px;border-top:1px solid #dce7e2;font-size:14px;line-height:23px;color:#49635b"><strong>${escape(t.location)}</strong><br>${escape(brand.address)}</p>` : ""}
</td></tr></table>
${calendar ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px"><tr><td align="center" bgcolor="#237c70" style="border-radius:8px;mso-padding-alt:15px 12px"><a href="${escape(calendar)}" style="display:block;padding:15px 12px;font-size:15px;line-height:22px;font-weight:bold;text-decoration:none;color:#ffffff">${escape(t.calendar)}</a></td></tr></table>` : ""}
${calendarNote ? `<p style="margin:16px 0 0;font-size:13px;line-height:21px;color:#61746d">${escape(calendarNote)}</p>` : ""}
<p style="margin:24px 0 4px;font-size:14px;line-height:23px;color:#61746d">${escape(help)}</p>
${contactUrl ? `<a href="${escape(contactUrl)}" style="color:#237c70;font-size:15px;line-height:26px;font-weight:bold;text-decoration:underline">${escape(t.contact)}</a>${brand.contactLabel ? `<p style="margin:8px 0 0;font-size:13px;line-height:21px;color:#61746d">${escape(brand.contactLabel)}</p>` : ""}` : ""}
</td></tr><tr><td align="center" style="padding:20px 12px;font-size:12px;line-height:20px;color:#7a8b83">${escape(input.workspaceName)}<br>${escape(t.footer)}</td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`,
  };
}
