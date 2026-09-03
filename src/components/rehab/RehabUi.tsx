import Link from "next/link";
import { Building2, CheckCircle2, Trophy } from "lucide-react";
import { getPathname, type Locale } from "@/i18n/routing";
import type { RehabAccessContext } from "@/lib/rehab/types";
import { cn } from "@/lib/utils";

export type RehabHref =
  | "/rehab"
  | "/rehab/pacijenti"
  | "/rehab/pacijenti/novi"
  | "/rehab/termini"
  | "/rehab/izvestaji"
  | "/rehab/tim";

export const rehabInputClass =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:bg-gray-50 disabled:text-gray-500";

export const rehabLabelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500";

export function rehabUrl(
  locale: Locale,
  href: RehabHref,
  query: Record<string, string | undefined> = {}
) {
  const pathname = getPathname({ locale, href });
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  return params.size ? `${pathname}?${params.toString()}` : pathname;
}

export function rehabPatientUrl(
  locale: Locale,
  patientId: string,
  query: Record<string, string | undefined> = {}
) {
  const pathname = getPathname({
    locale,
    href: {
      pathname: "/rehab/pacijenti/[id]",
      params: { id: patientId },
    },
  });
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  return params.size ? `${pathname}?${params.toString()}` : pathname;
}

export function rehabPlanPrintUrl(
  locale: Locale,
  patientId: string,
  planId: string,
  workspaceId: string
) {
  const pathname = getPathname({
    locale,
    href: {
      pathname: "/rehab/pacijenti/[id]/planovi/[planId]/stampa",
      params: { id: patientId, planId },
    },
  });
  return `${pathname}?${new URLSearchParams({ workspace: workspaceId }).toString()}`;
}

export function RehabPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-dark">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-3xl font-semibold text-navy md:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function WorkspaceTabs({
  access,
  selectedId,
  locale,
  href,
  query = {},
}: {
  access: RehabAccessContext;
  selectedId: string;
  locale: Locale;
  href: RehabHref;
  query?: Record<string, string | undefined>;
}) {
  if (access.workspaces.length <= 1) return null;
  return (
    <div className="mb-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1">
      {access.workspaces.map((workspace) => {
        const WorkspaceIcon = workspace.kind === "club" ? Trophy : Building2;
        const selected = workspace.id === selectedId;
        return (
          <Link
            key={workspace.id}
            href={rehabUrl(locale, href, { ...query, workspace: workspace.id })}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition",
              selected && workspace.kind === "club"
                ? "bg-amber-500 text-white"
                : selected
                  ? "bg-teal-dark text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-navy"
            )}
          >
            <WorkspaceIcon className="h-4 w-4" />
            {workspace.name}
          </Link>
        );
      })}
    </div>
  );
}

export function RehabAlert({
  error,
  saved,
}: {
  error?: string;
  saved?: string;
}) {
  if (!error && !saved) return null;
  const savedMessages: Record<string, string> = {
    created: "Nalog je kreiran i pristup je dodat.",
    assigned: "Pristup i privremena lozinka su ažurirani.",
    removed: "Pristup je uklonjen.",
  };
  return (
    <div
      role="status"
      className={cn(
        "mb-6 rounded-lg border px-4 py-3 text-sm",
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "flex items-center gap-2 border-emerald-200 bg-emerald-50 font-medium text-emerald-700"
      )}
    >
      {!error && <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />}
      {error || (saved ? savedMessages[saved] : undefined) || "Sačuvano."}
    </div>
  );
}

export function RehabPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-gray-200 bg-white p-5 md:p-6", className)}>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}
