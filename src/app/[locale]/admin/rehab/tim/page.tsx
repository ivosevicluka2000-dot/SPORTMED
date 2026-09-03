import { Building2, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { redirect } from "next/navigation";
import {
  addWorkspaceMemberAction,
  createClubWorkspaceAction,
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
  rehabPatientUrl,
} from "@/components/rehab/RehabUi";
import { RehabForm } from "@/components/rehab/RehabForm";
import { RehabSubmitButton } from "@/components/rehab/RehabSubmitButton";

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

  if (workspace.role === "player" && workspace.patientId) {
    redirect(rehabPatientUrl(locale, workspace.patientId, { workspace: workspace.id }));
  }

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
    .select("user_id, role, patient_id, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });
  const memberRows = (memberships ?? []) as Array<{
    user_id: string;
    role: RehabWorkspaceRole;
    patient_id: string | null;
    created_at: string;
  }>;
  const userIds = memberRows.map((member) => member.user_id);
  const [{ data: profiles }, authResult, { data: players }] = await Promise.all([
    userIds.length
      ? admin.from("profiles").select("id, full_name, phone").in("id", userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; phone: string | null }> }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    workspace.kind === "club"
      ? admin
          .from("rehab_patients")
          .select("id, first_name, last_name, status")
          .eq("workspace_id", workspace.id)
          .eq("record_type", "player")
          .order("status", { ascending: true })
          .order("last_name", { ascending: true })
      : Promise.resolve({ data: [] as Array<{ id: string; first_name: string; last_name: string; status: string }> }),
  ]);
  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );
  const authMap = new Map(
    (authResult.data?.users ?? []).map((user) => [user.id, user])
  );
  const playerMap = new Map(
    (players ?? []).map((player) => [player.id, player])
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
        <div className="mb-4 flex items-start gap-3">
          <span className="rounded-full bg-amber-50 p-2.5 text-amber-700">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-navy">Dodaj novi klub</h2>
            <p className="mt-1 text-sm text-gray-500">
              Svaki klub dobija potpuno odvojen prostor, igrače i naloge.
            </p>
          </div>
        </div>
        <RehabForm action={createClubWorkspaceAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="hidden" name="locale" value={locale} />
          <label className="w-full max-w-xl">
            <span className={rehabLabelClass}>Naziv kluba</span>
            <input name="name" required minLength={2} maxLength={150} className={rehabInputClass} />
          </label>
          <RehabSubmitButton className="rounded-md bg-amber-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-600">
            Dodaj klub
          </RehabSubmitButton>
        </RehabForm>
      </RehabPanel>

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
        <RehabForm action={addWorkspaceMemberAction} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-end">
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
              <select name="role" defaultValue="viewer" className={rehabInputClass}>
                <option value="viewer">Klub — svi igrači</option>
                <option value="player">Igrač — samo svoj karton</option>
              </select>
            </label>
          )}
          {workspace.kind === "club" && (
            <label className="sm:col-span-2 xl:col-span-4">
              <span className={rehabLabelClass}>Karton igrača (samo za igrački nalog)</span>
              <select name="patient_id" defaultValue="" className={rehabInputClass}>
                <option value="">Nije potrebno za nalog kluba</option>
                {(players ?? []).map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.first_name} {player.last_name}{player.status === "completed" ? " — završen" : ""}
                  </option>
                ))}
              </select>
              {(players ?? []).length === 0 && (
                <span className="mt-1 block text-xs text-amber-700">
                  Prvo napravite karton igrača, pa mu zatim otvorite nalog.
                </span>
              )}
            </label>
          )}
          <RehabSubmitButton className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-dark sm:col-span-2 xl:col-span-4">
            Sačuvaj nalog i pristup
          </RehabSubmitButton>
        </RehabForm>
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
              const linkedPlayer = member.patient_id
                ? playerMap.get(member.patient_id)
                : null;
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
                      {linkedPlayer && (
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          Karton: {linkedPlayer.first_name} {linkedPlayer.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-dark">
                      {member.role === "owner"
                        ? "Vlasnik"
                        : member.role === "therapist"
                          ? "Fizioterapeut"
                          : member.role === "player"
                            ? "Igrač — svoj karton"
                            : workspace.kind === "club"
                              ? "Klub — svi igrači"
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
