import { Mail, ShieldCheck, UserPlus } from "lucide-react";
import {
  addWorkspaceMemberAction,
  removeWorkspaceMemberAction,
} from "@/app/[locale]/admin/rehab/_actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRehabAccessContext, selectRehabWorkspace } from "@/lib/rehab/access";
import type { RehabWorkspaceRole } from "@/lib/rehab/types";
import type { Locale } from "@/i18n/routing";
import {
  EmptyState,
  RehabAlert,
  RehabPageHeader,
  RehabPanel,
  WorkspaceTabs,
  rehabInputClass,
  rehabLabelClass,
} from "@/components/rehab/RehabUi";

export const dynamic = "force-dynamic";

export default async function RehabTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ workspace?: string; error?: string; saved?: string }>;
}) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;

  if (!access.isGlobalAdmin) {
    return (
      <RehabPanel>
        <h1 className="font-heading text-2xl font-semibold text-navy">Pristupi</h1>
        <p className="mt-2 text-sm text-gray-600">Samo glavni administrator može da dodaje ili uklanja naloge.</p>
      </RehabPanel>
    );
  }

  const admin = createAdminClient();
  const { data: memberships } = await admin
    .from("rehab_workspace_members")
    .select("user_id, role, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });
  const memberRows = (memberships ?? []) as Array<{
    user_id: string;
    role: RehabWorkspaceRole;
    created_at: string;
  }>;
  const userIds = memberRows.map((member) => member.user_id);
  const [{ data: profiles }, authResult] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, full_name, phone").in("id", userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; phone: string | null }> }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );
  const authMap = new Map(
    (authResult.data?.users ?? []).map((user) => [user.id, user])
  );

  return (
    <div>
      <RehabPageHeader
        eyebrow={workspace.name}
        title="Nalozi i pristupi"
        description="Ovde glavni administrator pravi naloge za kolege i određuje kom delu Rehab platforme mogu da pristupe."
      />
      <WorkspaceTabs
        access={access}
        selectedId={workspace.id}
        locale={locale}
        href="/rehab/tim"
      />
      <RehabAlert error={query.error} saved={query.saved} />

      <RehabPanel className="mb-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="rounded-full bg-teal-50 p-2.5 text-teal-dark">
            <UserPlus className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-navy">Napravi Rehab nalog</h2>
            <p className="mt-1 text-sm text-gray-500">
              Unesite podatke, izaberite dozvolu i kolegi prosledite privremenu lozinku. Ako email već postoji, uneta lozinka postaje njegova nova privremena lozinka.
            </p>
          </div>
        </div>
        <form action={addWorkspaceMemberAction} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-end">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="workspace_id" value={workspace.id} />
          <label>
            <span className={rehabLabelClass}>Ime i prezime</span>
            <input name="full_name" required minLength={2} maxLength={100} className={rehabInputClass} />
          </label>
          <label>
            <span className={rehabLabelClass}>Email</span>
            <input name="email" type="email" required className={rehabInputClass} />
          </label>
          <label>
            <span className={rehabLabelClass}>Privremena lozinka</span>
            <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={rehabInputClass} />
          </label>
          {workspace.kind === "clinic" ? (
            <label>
              <span className={rehabLabelClass}>Dozvola</span>
              <select name="role" defaultValue="therapist" className={rehabInputClass}>
                <option value="therapist">Fizioterapeut — unos i izmene</option>
                <option value="viewer">Samo pregled</option>
              </select>
            </label>
          ) : (
            <label>
              <span className={rehabLabelClass}>Dozvola</span>
              <input value="Samo pregled kluba" disabled className={rehabInputClass} />
              <input type="hidden" name="role" value="viewer" />
            </label>
          )}
          <button className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-dark sm:col-span-2 xl:col-span-4">
            Sačuvaj nalog i pristup
          </button>
        </form>
      </RehabPanel>

      <RehabPanel>
        <h2 className="mb-5 font-heading text-2xl font-semibold text-navy">Aktivni pristupi</h2>
        {memberRows.length === 0 ? (
          <EmptyState>Nema dodatih korisnika. Vlasnik kao administrator već ima pristup.</EmptyState>
        ) : (
          <div className="divide-y divide-gray-100">
            {memberRows.map((member) => {
              const profile = profileMap.get(member.user_id);
              const authUser = authMap.get(member.user_id);
              return (
                <div key={member.user_id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-full bg-gray-100 p-2.5 text-gray-600">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy">
                        {profile?.full_name || authUser?.email || "Korisnik"}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="h-3 w-3" /> {authUser?.email || "Email nije dostupan"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-dark">
                      {member.role === "owner"
                        ? "Vlasnik"
                        : member.role === "therapist"
                          ? "Fizioterapeut"
                          : "Samo pregled"}
                    </span>
                    {member.role !== "owner" && (
                      <form action={removeWorkspaceMemberAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="workspace_id" value={workspace.id} />
                        <input type="hidden" name="user_id" value={member.user_id} />
                        <button className="text-xs font-medium text-red-600 hover:underline">
                          Ukloni
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </RehabPanel>
    </div>
  );
}
