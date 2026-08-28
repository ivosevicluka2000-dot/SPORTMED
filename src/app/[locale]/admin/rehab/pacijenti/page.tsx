import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getRehabAccessContext, selectRehabWorkspace } from "@/lib/rehab/access";
import { formatRehabDate } from "@/lib/rehab/dates";
import type { RehabPatient } from "@/lib/rehab/types";
import type { Locale } from "@/i18n/routing";
import {
  EmptyState,
  RehabPageHeader,
  RehabPanel,
  WorkspaceTabs,
  rehabInputClass,
  rehabPatientUrl,
  rehabUrl,
} from "@/components/rehab/RehabUi";

export const dynamic = "force-dynamic";

export default async function RehabPatientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ workspace?: string; q?: string; status?: string }>;
}) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;

  const supabase = await createClient();
  let request = supabase
    .from("rehab_patients")
    .select(
      "id, workspace_id, record_type, first_name, last_name, email, phone, birth_date, problem, started_on, status, notes, created_at, updated_at"
    )
    .eq("workspace_id", workspace.id)
    .order("status", { ascending: true })
    .order("last_name", { ascending: true });

  const status = query.status === "completed" ? "completed" : query.status === "all" ? "all" : "active";
  if (status !== "all") request = request.eq("status", status);
  const search = (query.q ?? "").trim().replace(/[%(),]/g, "");
  if (search) {
    request = request.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,problem.ilike.%${search}%`);
  }
  const { data } = await request.limit(300);
  const rows = (data ?? []) as RehabPatient[];

  return (
    <div>
      <RehabPageHeader
        eyebrow={workspace.name}
        title={workspace.kind === "club" ? "Igrači" : "Pacijenti"}
        description="Kartoni, kontakt podaci, problem i početak rehabilitacije."
        action={
          workspace.canEdit ? (
            <Link
              href={rehabUrl(locale, "/rehab/pacijenti/novi", { workspace: workspace.id })}
              className="rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark"
            >
              + {workspace.kind === "club" ? "Novi igrač" : "Novi pacijent"}
            </Link>
          ) : null
        }
      />
      <WorkspaceTabs
        access={access}
        selectedId={workspace.id}
        locale={locale}
        href="/rehab/pacijenti"
        query={{ q: query.q, status }}
      />

      <RehabPanel className="mb-6">
        <form method="get" className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <input type="hidden" name="workspace" value={workspace.id} />
          <label className="relative">
            <span className="sr-only">Pretraga</span>
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="Ime, prezime ili problem..."
              className={`${rehabInputClass} pl-9`}
            />
          </label>
          <select name="status" defaultValue={status} className={rehabInputClass}>
            <option value="active">Aktivni</option>
            <option value="completed">Završeni</option>
            <option value="all">Svi</option>
          </select>
          <button className="rounded-md bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900">
            Prikaži
          </button>
        </form>
      </RehabPanel>

      {rows.length === 0 ? (
        <EmptyState>Nema zapisa za izabrani filter.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((patient) => (
            <Link
              key={patient.id}
              href={rehabPatientUrl(locale, patient.id, { workspace: workspace.id })}
              className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal/60 hover:shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-full bg-teal-50 p-2.5 text-teal-dark">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-navy group-hover:text-navy-dark">
                      {patient.first_name} {patient.last_name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Od {formatRehabDate(patient.started_on)}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    patient.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {patient.status === "active" ? "Aktivan" : "Završen"}
                </span>
              </div>
              <p className="line-clamp-2 min-h-10 text-sm text-gray-600">
                {patient.problem || "Problem nije unet."}
              </p>
              <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                {patient.phone || patient.email || "Kontakt nije unet"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
