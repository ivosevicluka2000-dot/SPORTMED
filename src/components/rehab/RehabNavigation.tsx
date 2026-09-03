"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Activity,
  Building2,
  CalendarDays,
  FileText,
  MoreHorizontal,
  Shield,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { usePathname, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { rehabUrl, type RehabHref } from "@/components/rehab/RehabUi";
import type { RehabAccessContext } from "@/lib/rehab/types";

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

type WorkspaceOption = RehabAccessContext["workspaces"][number];

export function RehabNavigation({
  isGlobalAdmin,
  workspaces,
}: {
  isGlobalAdmin: boolean;
  workspaces: WorkspaceOption[];
}) {
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const workspace = searchParams.get("workspace") ?? undefined;
  const selectedWorkspace =
    workspaces.find((item) => item.id === workspace) ?? workspaces[0];
  const items = isGlobalAdmin
    ? [...baseItems, { href: "/rehab/tim" as RehabHref, label: "Nalozi i pristupi", icon: Users }]
    : baseItems;

  const linkClass = (href: RehabHref) => {
    const isActive = href === "/rehab"
      ? pathname === "/rehab"
      : pathname === href || pathname.startsWith(`${href}/`);
    return cn(
      "inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
      isActive
        ? "bg-navy text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-navy"
    );
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-3 sm:px-6 lg:px-8">
      {selectedWorkspace && (
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Radni prostor
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              selectedWorkspace.kind === "club"
                ? "bg-amber-100 text-amber-800"
                : "bg-teal-50 text-teal-dark"
            )}
          >
            {selectedWorkspace.kind === "club" ? (
              <Trophy className="h-3.5 w-3.5" />
            ) : (
              <Building2 className="h-3.5 w-3.5" />
            )}
            {selectedWorkspace.name}
          </span>
        </div>
      )}

      <nav aria-label="Rehab navigacija">
        <div className="hidden gap-1 overflow-x-auto sm:flex">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={rehabUrl(locale, item.href, { workspace })}
                className={`${linkClass(item.href)} min-w-max`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className={cn("grid gap-1 sm:hidden", isGlobalAdmin ? "grid-cols-5" : "grid-cols-4")}>
          {baseItems.map((item) => {
            const Icon = item.icon;
            const shortLabel = item.href === "/rehab/pacijenti" ? "Kartoni" : item.label;
            return (
              <Link
                key={item.href}
                href={rehabUrl(locale, item.href, { workspace })}
                className={`${linkClass(item.href)} flex-col gap-1 px-1 py-2 text-[11px]`}
              >
                <Icon className="h-4 w-4" />
                {shortLabel}
              </Link>
            );
          })}
          {isGlobalAdmin && (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium text-gray-600 hover:bg-gray-100 [&::-webkit-details-marker]:hidden">
                <MoreHorizontal className="h-4 w-4" />
                Više
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-52 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                <Link
                  href={rehabUrl(locale, "/rehab/tim", { workspace })}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Users className="h-4 w-4" />
                  Nalozi i pristupi
                </Link>
                <Link
                  href={`/${locale}/admin`}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Shield className="h-4 w-4" />
                  Glavni admin
                </Link>
              </div>
            </details>
          )}
        </div>
      </nav>
    </div>
  );
}
