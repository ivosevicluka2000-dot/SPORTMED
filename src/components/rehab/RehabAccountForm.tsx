import { addSimpleRehabAccountAction } from "@/app/[locale]/admin/rehab/_management-actions";
import { RehabForm } from "./RehabForm";
import { RehabSubmitButton } from "./RehabSubmitButton";
import { rehabInputClass, rehabLabelClass } from "./RehabUi";
import type { Locale } from "@/i18n/routing";

export function RehabAccountForm({ locale, workspaceId, kind, player, workspaceName }: {
  locale: Locale; workspaceId: string; workspaceName: string; kind: "clinic" | "club";
  player?: { id: string; name: string; email: string | null };
}) {
  const scope = player ? "Ovaj nalog vidi samo svoj karton, dnevne unose i planove."
    : kind === "clinic" ? "Fizioterapeut vidi i uređuje sve pacijente klinike. Nema pristup klubovima."
    : `Ova osoba vidi sve igrače kluba ${workspaceName}, uključujući one koje dodate kasnije. Pristup je samo za pregled.`;
  return <RehabForm action={addSimpleRehabAccountAction} className="space-y-4">
    <input type="hidden" name="locale" value={locale} />
    <input type="hidden" name="workspace_id" value={workspaceId} />
    <input type="hidden" name="role" value={player ? "player" : kind === "clinic" ? "therapist" : "viewer"} />
    {player && <><input type="hidden" name="patient_id" value={player.id} /><input type="hidden" name="return_to" value="patient" /></>}
    <p className="rounded-lg bg-teal-50 p-3 text-sm leading-6 text-teal-dark">{scope}</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span className={rehabLabelClass}>Ime i prezime</span><input name="full_name" required minLength={2} maxLength={100} defaultValue={player?.name} className={rehabInputClass} /></label>
      <label><span className={rehabLabelClass}>Email za prijavu</span><input name="email" type="email" required defaultValue={player?.email ?? ""} className={rehabInputClass} /></label>
      <label className="sm:col-span-2"><span className={rehabLabelClass}>Početna lozinka za novi nalog</span><input name="password" type="password" minLength={8} maxLength={72} autoComplete="new-password" className={rehabInputClass} /><span className="mt-1 block text-xs text-gray-500">Najmanje 8 znakova. Ako osoba već ima nalog, ostavite prazno: njena lozinka ostaje ista.</span></label>
    </div>
    <RehabSubmitButton className="rounded-md bg-navy px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{player ? "Omogući igraču prijavu" : kind === "clinic" ? "Dodaj fizioterapeuta" : "Dodaj osobu sa pristupom"}</RehabSubmitButton>
  </RehabForm>;
}
