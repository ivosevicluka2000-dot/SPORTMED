import Link from "next/link";
import { createClubWorkspaceAction } from "@/app/[locale]/admin/rehab/_actions";
import { getRehabAccessContext } from "@/lib/rehab/access";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/routing";
import { RehabPageHeader, RehabAlert, RehabPanel, rehabInputClass, rehabUrl } from "@/components/rehab/RehabUi";
import { RehabForm } from "@/components/rehab/RehabForm";
import { RehabSubmitButton } from "@/components/rehab/RehabSubmitButton";

export const dynamic = "force-dynamic";
export default async function ClubsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const access = await getRehabAccessContext(locale);
  if (!access.isGlobalAdmin) return <RehabPanel>Spisak svih klubova dostupan je samo glavnom administratoru.</RehabPanel>;
  const supabase = await createClient();
  const clubs = await Promise.all(access.workspaces.filter(w => w.kind === "club").map(async club => {
    const { count, error } = await supabase.from("rehab_patients").select("id", { count: "exact", head: true }).eq("workspace_id", club.id).eq("record_type", "player");
    return { ...club, count: error ? null : count };
  }));
  return <div>
    <RehabPageHeader title="Klubovi" description="Svaki klub ima svoje igrače i svoje naloge. Najpre dodajte klub, a igrače i osobe sa pristupom možete dodati i kasnije." />
    <RehabAlert error={query.error} />
    <RehabPanel className="mb-6"><h2 className="mb-4 font-heading text-2xl font-semibold text-navy">Dodaj klub</h2>
      <RehabForm action={createClubWorkspaceAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="locale" value={locale} />
        <label className="flex-1 text-sm">Naziv kluba<input name="name" required minLength={2} maxLength={150} className={`${rehabInputClass} mt-1`} /></label>
        <RehabSubmitButton className="rounded-md bg-navy px-5 py-3 text-sm font-medium text-white">Dodaj klub</RehabSubmitButton>
      </RehabForm>
    </RehabPanel>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{clubs.map(club => <RehabPanel key={club.id}>
      <h2 className="break-words font-heading text-xl font-semibold text-navy">{club.name}</h2>
      <p className="mb-4 mt-2 text-sm text-gray-500">{club.count === null ? "Broj igrača nije dostupan" : `Igrača: ${club.count}`}</p>
      <div className="flex flex-wrap gap-3"><Link className="rounded-md bg-navy px-4 py-2 text-sm text-white" href={rehabUrl(locale, "/rehab/pacijenti", { workspace: club.id })}>Otvori klub</Link><Link className="py-2 text-sm text-teal underline" href={rehabUrl(locale, "/rehab/tim", { workspace: club.id })}>Osobe sa pristupom</Link></div>
    </RehabPanel>)}</div>
    {!clubs.length && <p className="text-gray-500">Još nema klubova. Unesite naziv prvog kluba iznad.</p>}
  </div>;
}
