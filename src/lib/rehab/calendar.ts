import { dateInputValue, isValidRehabDate, localBelgradeDateTimeToIso } from "./dates.ts";

export function rehabCalendarMonth(value: string | undefined, today: string) {
  return value && isValidRehabDate(`${value}-01`) ? value : today.slice(0, 7);
}

export function shiftRehabMonth(month: string, offset: number) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

// Monday is the first column; padding cells never belong to another month's query.
export function rehabMonthDays(month: string): Array<string | null> {
  const first = new Date(`${month}-01T12:00:00Z`);
  const padding = (first.getUTCDay() + 6) % 7;
  const last = new Date(first);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  const days: Array<string | null> = Array(padding).fill(null);
  for (let day = 1; day <= last.getUTCDate(); day++) {
    days.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  while (days.length % 7) days.push(null);
  return days;
}

export function rehabAppointmentDay(startsAt: string) {
  return dateInputValue(new Date(startsAt));
}

export function rehabMonthBounds(month: string) {
  const days = rehabMonthDays(month).filter((day): day is string => day !== null);
  // Use the last supported local date so December 2100 also has a valid upper bound.
  return {
    start: localBelgradeDateTimeToIso(`${month}-01T00:00`),
    end: new Date(new Date(localBelgradeDateTimeToIso(`${days.at(-1)}T23:59`)).getTime() + 60_000).toISOString(),
  };
}
