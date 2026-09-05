const BELGRADE_TIME_ZONE = "Europe/Belgrade";

const REHAB_MIN_YEAR = 1900;
const REHAB_MAX_YEAR = 2100;

export function isValidRehabDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (year < REHAB_MIN_YEAR || year > REHAB_MAX_YEAR) return false;

  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function formatRehabDate(value: string | Date, withTime = false): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("sr-RS", {
    timeZone: BELGRADE_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit", hour12: false }
      : {}),
  }).format(date);
}
export function localBelgradeDateTimeToIso(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Termin nije ispravno unet.");

  const [, y, m, d, hh, mm] = match;
  if (
    !isValidRehabDate(`${y}-${m}-${d}`) ||
    Number(hh) < 0 ||
    Number(hh) > 23 ||
    Number(mm) < 0 ||
    Number(mm) > 59
  ) {
    throw new Error("Termin nije ispravno unet.");
  }
  const targetUtc = Date.UTC(+y, +m - 1, +d, +hh, +mm);
  const guess = new Date(targetUtc);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BELGRADE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(guess);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const renderedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute)
  );
  const offset = renderedAsUtc - targetUtc;
  return new Date(targetUtc - offset).toISOString();
}

export function dateInputValue(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BELGRADE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function monthInputValue(date = new Date()): string {
  return dateInputValue(date).slice(0, 7);
}

export function dateTimeLocalInputValue(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BELGRADE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}
