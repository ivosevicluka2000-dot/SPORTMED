import { getPathname, type Locale } from "@/i18n/routing";

export function safeRehabNext(locale: Locale, value?: string | null): string {
  const fallback = getPathname({ locale, href: "/rehab" });
  if (!value) return fallback;

  try {
    const base = "http://rehab.local";
    const url = new URL(value, base);
    const isLocal = url.origin === base;
    const isRehabPath = url.pathname === fallback || url.pathname.startsWith(`${fallback}/`);
    return isLocal && isRehabPath ? `${url.pathname}${url.search}` : fallback;
  } catch {
    return fallback;
  }
}
