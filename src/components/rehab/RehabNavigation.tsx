"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Activity, CalendarDays, FileText, UserRound, Users } from "lucide-react";
import { usePathname, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { rehabUrl, type RehabHref } from "@/components/rehab/RehabUi";

const baseItems: Array<{
  href: RehabHref;
  label: string;
  icon: typeof Activity;
}> = [
  { href: "/rehab", label: "Pregled", icon: Activity },
  { href: "/rehab/pacijenti", label: "Pacijenti i igrači", icon: UserRound },
  { href: "/rehab/termini", label: "Termini", icon: CalendarDays },
  { href: "/rehab/izvestaji", label: "Izveštaji", icon: FileText },
];

export function RehabNavigation({ isGlobalAdmin }: { isGlobalAdmin: boolean }) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const workspace = searchParams.get("workspace") ?? undefined;
  const items = isGlobalAdmin
    ? [...baseItems, { href: "/rehab/tim" as RehabHref, label: "Nalozi i pristupi", icon: Users }]
    : baseItems;

  return (
    <nav
      className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8"
      aria-label="Rehab navigacija"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.href === "/rehab"
          ? pathname === "/rehab"
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={rehabUrl(locale, item.href, { workspace })}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-navy text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-navy"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
