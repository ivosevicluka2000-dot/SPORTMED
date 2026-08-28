import { redirect } from "next/navigation";
import { getPathname, type Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function LegacyAdminRehabLayout({
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  redirect(getPathname({ locale: rawLocale as Locale, href: "/rehab" }));
}
