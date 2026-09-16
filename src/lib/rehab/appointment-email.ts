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

const copy = {
  sr: {
    created: ["Potvrda zakazanog termina", "Vaš termin je zakazan."],
    updated: ["Izmena termina", "Podaci vašeg termina su izmenjeni. U nastavku su aktuelni detalji."],
    scheduled: ["Termin je ponovo zakazan", "Vaš termin je ponovo aktivan."],
    completed: ["Termin je završen", "Vaš termin je označen kao završen. Hvala na dolasku."],
    cancelled: ["Termin je otkazan", "Vaš termin je otkazan. Za ovaj termin nije potrebno da dolazite."],
    deleted: ["Termin je uklonjen", "Vaš termin je uklonjen iz rasporeda."],
    reminder: ["Podsetnik za termin", "Podsećamo vas na predstojeći termin."],
    hello: "Poštovani", when: "Datum i vreme", before: "Prethodni datum i vreme", duration: "Trajanje",
    timezone: "Vreme je prikazano po vremenskoj zoni Beograda.",
    contact: "Za pitanja ili promenu termina, kontaktirajte svoju kliniku ili klub.",
    status: { scheduled: "Zakazan", completed: "Završen", cancelled: "Otkazan" }, statusLabel: "Status",
  },
  en: {
    created: ["Appointment confirmation", "Your appointment has been scheduled."],
    updated: ["Appointment updated", "Your appointment details have changed. The current details are below."],
    scheduled: ["Appointment scheduled again", "Your appointment is active again."],
    completed: ["Appointment completed", "Your appointment has been marked as completed. Thank you for attending."],
    cancelled: ["Appointment cancelled", "Your appointment has been cancelled. You do not need to attend this appointment."],
    deleted: ["Appointment removed", "Your appointment has been removed from the schedule."],
    reminder: ["Appointment reminder", "This is a reminder of your upcoming appointment."],
    hello: "Hello", when: "Date and time", before: "Previous date and time", duration: "Duration",
    timezone: "Times are shown in the Belgrade time zone.",
    contact: "For questions or appointment changes, contact your clinic or club.",
    status: { scheduled: "Scheduled", completed: "Completed", cancelled: "Cancelled" }, statusLabel: "Status",
  },
} as const;

function escape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Deliberately accepts only scheduling data, never therapy details or internal notes.
export function buildAppointmentEmail(event: AppointmentEmailEvent, input: AppointmentEmailPayload) {
  const t = copy[input.locale];
  const [title, intro] = t[event];
  const date = (value: string) => new Intl.DateTimeFormat(input.locale === "en" ? "en-GB" : "sr-RS", {
    timeZone: "Europe/Belgrade", dateStyle: "full", timeStyle: "short", hour12: false,
  }).format(new Date(value));
  const lines = [
    `${t.hello} ${input.patientName},`, "", intro, "", input.workspaceName,
    `${t.when}: ${date(input.startsAt)}`,
    ...(input.previousStartsAt && new Date(input.previousStartsAt).getTime() !== new Date(input.startsAt).getTime()
      ? [`${t.before}: ${date(input.previousStartsAt)}`] : []),
    `${t.duration}: ${input.durationMinutes} min`,
    ...(event !== "deleted" ? [`${t.statusLabel}: ${t.status[input.appointmentStatus]}`] : []),
    t.timezone, "", t.contact,
  ];
  return {
    subject: `${title} — ${input.workspaceName}`,
    text: lines.join("\n"),
    html: `<!doctype html><html lang="${input.locale}"><body style="font-family:Arial,sans-serif;color:#1e293b;background:#f8fafc;padding:24px"><div style="max-width:560px;margin:auto;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:28px"><h1 style="font-size:22px;color:#4f636a">${escape(title)}</h1>${lines.map(line => line ? `<p style="line-height:1.6;margin:8px 0">${escape(line)}</p>` : '<div style="height:12px"></div>').join("")}</div></body></html>`,
  };
}
