"use client";
import { useState } from "react";
import { transferRehabPlayerAction } from "@/app/[locale]/admin/rehab/_management-actions";
import { RehabForm } from "./RehabForm";
import { RehabSubmitButton } from "./RehabSubmitButton";
import { rehabInputClass } from "./RehabUi";

export function RehabTransferPlayerForm({ locale, workspaceId, workspaceName, players }: {
  locale: string; workspaceId: string; workspaceName: string;
  players: Array<{ id: string; name: string; workspaceId: string; clubName: string }>;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const player = players.find(p => p.id === selectedId);
  const visible = players.filter(p => `${p.name} ${p.clubName}`.toLocaleLowerCase("sr").includes(search.toLocaleLowerCase("sr")));
  return <RehabForm action={transferRehabPlayerAction} className="mt-4 space-y-4">
    <input type="hidden" name="locale" value={locale} />
    <input type="hidden" name="workspace_id" value={workspaceId} />
    <input type="hidden" name="source_workspace_id" value={player?.workspaceId ?? ""} />
    <label className="block text-sm">Pronađi igrača ili klub<input type="search" value={search} onChange={e => setSearch(e.target.value)} className={`${rehabInputClass} mt-1`} /></label>
    <label className="block text-sm">Postojeći igrač<select name="patient_id" required value={selectedId} onChange={e => { setSelectedId(e.target.value); setConfirmed(false); }} className={`${rehabInputClass} mt-1`}>
      <option value="">Izaberite igrača</option>
      {visible.map(p => <option value={p.id} key={p.id}>{p.name} — {p.clubName}</option>)}
      {player && !visible.some(p => p.id === player.id) && <option value={player.id}>{player.name} — {player.clubName}</option>}
    </select></label>
    {players.length === 0 && <p className="text-sm text-gray-500">Nema igrača iz drugih klubova. Novog igrača dodajte dugmetom „Novi igrač”.</p>}
    {player && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      <p><strong>{player.name}</strong>: {player.clubName} → <strong>{workspaceName}</strong></p>
      <p className="mt-2">Prebacuju se ceo sportski karton, terapije, slike, planovi, termini i igrački nalog. Stari klub gubi pristup; novi klub dobija pregled svega navedenog. Klinički kartoni se ne prebacuju. Ranije preuzete izveštaje nije moguće povući; već otvoreni linkovi slika mogu važiti do isteka.</p>
      <label className="mt-3 flex items-start gap-2"><input type="checkbox" name="confirm_transfer" value="yes" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" /><span>Potvrđujem premeštanje i deljenje sportskog kartona sa novim klubom.</span></label>
    </div>}
    <RehabSubmitButton disabled={!player || !confirmed} className="rounded-md bg-navy px-5 py-3 text-sm font-medium text-white disabled:opacity-50">Premesti igrača u ovaj klub</RehabSubmitButton>
  </RehabForm>;
}
