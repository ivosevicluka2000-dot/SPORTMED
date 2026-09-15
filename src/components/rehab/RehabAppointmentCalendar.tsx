import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { RehabAppointment } from "@/lib/rehab/types";
import { rehabAppointmentDay, rehabMonthDays, shiftRehabMonth } from "@/lib/rehab/calendar";
import { isValidRehabDate } from "@/lib/rehab/dates";
import { rehabUrl } from "./RehabUi";

export function RehabAppointmentCalendar({ month, today, selectedDay, rows, locale, workspaceId }: {
  month: string; today: string; selectedDay?: string; rows: RehabAppointment[]; locale: Locale; workspaceId: string;
}) {
  const t = useTranslations("rehab");
  const language = locale === "en" ? "en-GB" : "sr-Latn-RS";
  const monthLabel = new Intl.DateTimeFormat(language, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T12:00:00Z`));
  const dayLabel = new Intl.DateTimeFormat(language, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const timeLabel = new Intl.DateTimeFormat(language, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Belgrade" });
  const href = (targetMonth: string, day?: string) => rehabUrl(locale, "/rehab/termini", { workspace: workspaceId, month: targetMonth, day });
  const grouped = new Map<string, RehabAppointment[]>();
  for (const row of rows) {
    const key = rehabAppointmentDay(row.starts_at);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  return (
    <section aria-label={t("calendarTitle")} className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-navy px-4 py-5 text-white sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-200">{t("calendarTitle")}</p>
          <h2 className="mt-1 font-heading text-3xl font-semibold capitalize sm:text-4xl">{monthLabel}</h2>
        </div>
        <nav aria-label={t("calendarNavigation")} className="flex items-center gap-2">
          {isValidRehabDate(`${shiftRehabMonth(month, -1)}-01`) && <Link prefetch={false} href={href(shiftRehabMonth(month, -1))} aria-label={t("calendarPrevious")} className="rounded-lg border border-white/30 p-2.5 hover:bg-white/10"><ChevronLeft className="h-5 w-5" /></Link>}
          <Link prefetch={false} href={href(today.slice(0, 7), today)} className="rounded-lg border border-white/30 px-3 py-2.5 text-sm hover:bg-white/10">{t("labelToday")}</Link>
          {isValidRehabDate(`${shiftRehabMonth(month, 1)}-01`) && <Link prefetch={false} href={href(shiftRehabMonth(month, 1))} aria-label={t("calendarNext")} className="rounded-lg border border-white/30 p-2.5 hover:bg-white/10"><ChevronRight className="h-5 w-5" /></Link>}
        </nav>
      </div>
      <div className="grid grid-cols-7 bg-gray-50">
        {Array.from({ length: 7 }, (_, i) => <div key={i} className="py-3 text-center text-xs font-semibold uppercase text-gray-500">{new Intl.DateTimeFormat(language, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 8, 7 + i)))}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {rehabMonthDays(month).map((day, index) => {
          if (!day) return <div key={`padding-${index}`} className="min-h-20 bg-gray-50 sm:min-h-32" />;
          const appointments = grouped.get(day) ?? [];
          const selected = day === selectedDay;
          return <Link key={day} prefetch={false} scroll={false} href={href(month, day)} aria-current={selected ? "date" : undefined} aria-label={`${dayLabel.format(new Date(`${day}T12:00:00Z`))} · ${t("calendarCount", { count: appointments.length })}${day === today ? ` · ${t("labelToday")}` : ""}`} className={`min-h-20 min-w-0 p-1.5 transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-teal sm:min-h-32 sm:p-3 ${selected ? "bg-teal-50 ring-2 ring-inset ring-teal-dark" : "bg-white hover:bg-teal-50/60"}`}>
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${day === today ? "bg-navy text-white" : "text-navy"}`}>{Number(day.slice(-2))}</span>
              {appointments.length > 0 && <span className="rounded-full bg-teal-50 px-1.5 text-xs font-semibold text-teal-dark">{appointments.length}</span>}
            </div>
            <div className="mt-2 hidden space-y-1 sm:block">
              {appointments.slice(0, 2).map(row => <p key={row.id} className={`truncate rounded px-1.5 py-1 text-xs ${row.status === "scheduled" ? "bg-sky-50 text-sky-800" : row.status === "completed" ? "bg-emerald-50 text-emerald-800" : "bg-gray-100 text-gray-500 line-through"}`}><span className="font-semibold">{timeLabel.format(new Date(row.starts_at))}</span> {row.patient?.first_name} {row.patient?.last_name}</p>)}
              {appointments.length > 2 && <p className="text-xs text-gray-500">+{appointments.length - 2}</p>}
            </div>
          </Link>;
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-gray-500">
        <p>{t("calendarHint")}</p>
        <Link prefetch={false} href={href(month)} scroll={false} className="font-medium text-teal-dark hover:underline">{t("calendarWholeMonth")}</Link>
      </div>
    </section>
  );
}
