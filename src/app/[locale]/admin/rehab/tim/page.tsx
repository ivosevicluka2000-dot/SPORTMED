import { redirect } from "next/navigation";
import { getRehabAccessContext, selectRehabWorkspace } from "@/lib/rehab/access";
import type { Locale } from "@/i18n/routing";
import { RehabAlert, RehabPageHeader, RehabPanel, rehabPatientUrl } from "@/components/rehab/RehabUi";
import { RehabAccountForm } from "@/components/rehab/RehabAccountForm";
import { RehabContextTabs } from "@/components/rehab/RehabContextTabs";
import { RehabMemberList } from "@/components/rehab/RehabMemberList";

export const dynamic = "force-dynamic";
export default async function RehabTeamPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ workspace?: string; error?: string; saved?: string }>;
}) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  const workspace = selectRehabWorkspace(access, query.workspace);
  if (!workspace) return null;
  if (workspace.role === "player" && workspace.patientId) redirect(rehabPatientUrl(locale, workspace.patientId, { workspace: workspace.id }));
  if (!access.isGlobalAdmin) return <RehabPanel>Samo glavni administrator može da dodaje ili uklanja naloge.</RehabPanel>;
  const clinic = workspace.kind === "clinic";
  return <div>
    <RehabPageHeader eyebrow={clinic ? "Klinika" : "Klub"} title={workspace.name} description={clinic ? "Dodajte fizioterapeuta. Svi fizioterapeuti automatski imaju pristup svim pacijentima klinike." : "Dodajte vlasnika, trenera ili drugu osobu koja treba da prati igrače ovog kluba."} />
    <RehabContextTabs locale={locale} workspace={workspace} current="access" isAdmin />
    <RehabAlert error={query.error} saved={query.saved} />
    <RehabPanel className="mb-6 max-w-3xl"><h2 className="mb-4 font-heading text-2xl font-semibold text-navy">{clinic ? "Dodaj fizioterapeuta" : "Dodaj osobu sa pristupom"}</h2>
      <RehabAccountForm locale={locale} workspaceId={workspace.id} workspaceName={workspace.name} kind={workspace.kind} />
      {!clinic && <p className="mt-4 text-sm text-gray-500">Za lični nalog igrača otvorite njegov karton i izaberite „Omogući igraču prijavu”.</p>}
    </RehabPanel>
    <RehabPanel><h2 className="mb-3 font-heading text-2xl font-semibold text-navy">{clinic ? "Fizioterapeuti i postojeći pristupi" : "Osobe sa pristupom ovom klubu"}</h2><RehabMemberList locale={locale} workspace={workspace} /></RehabPanel>
  </div>;
}
