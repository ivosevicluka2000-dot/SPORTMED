import "server-only";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-helpers";
import { getPathname, type Locale } from "@/i18n/routing";

export default async function AdminOnlyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  try {
    await requireAdmin();
  } catch {
    redirect(getPathname({ locale, href: "/rehab" }));
  }
  return children;
}
