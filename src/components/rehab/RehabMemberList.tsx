import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-helpers";
import { removeWorkspaceMemberAction } from "@/app/[locale]/admin/rehab/_actions";
import { getPathname, type Locale } from "@/i18n/routing";
import { RehabCopyAccessButton } from "./RehabCopyAccessButton";
import { RehabConfirmSubmitButton } from "./RehabConfirmSubmitButton";

export async function RehabMemberList({ locale, workspace, patientId }: {
  locale: Locale; workspace: { id: string; name: string; kind: string }; patientId?: string;
}) {
  const t = await getTranslations("rehab");
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin.from("rehab_workspace_members").select("user_id, role, patient_id").eq("workspace_id", workspace.id).order("created_at");
  if (patientId) query = query.eq("patient_id", patientId);
  const { data: members, error } = await query;
  if (error) return <p role="alert">{t("labelAccessDetailsAreCurrentlyUnavailableRefreshThe")}</p>;
  if (!members?.length) return <p className="text-sm text-gray-500">{t("labelNoAccountsHaveThisAccessYetThe")}</p>;
  const users = await Promise.all(members.map(async member => {
    const { data } = await admin.auth.admin.getUserById(member.user_id);
    return { ...member, user: data.user };
  }));
  return <div className="divide-y divide-gray-100">{users.map(member => {
    const scope = member.role === "player" ? t("labelOwnRecordAndPlansOnly") : workspace.kind === "clinic" ? member.role === "viewer" ? t("labelClinicViewOnly") : t("labelAllClinicPatientsCreateAndEdit") : t("labelAllPlayersViewOnly", {v0: workspace.name});
    return <div key={member.user_id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><p className="break-words font-medium text-navy">{member.user?.user_metadata?.full_name || member.user?.email || t("labelUser")}</p><p className="break-all text-sm text-gray-600">{member.user?.email}</p><p className="my-2 text-xs text-teal-dark">{scope}</p>
        {member.user?.email && <RehabCopyAccessButton email={member.user.email} scope={scope} loginUrl={`https://www.sportcaremed.com${getPathname({ locale, href: "/rehab/prijava" })}`} />}
      </div>
      {member.role !== "owner" && <form action={removeWorkspaceMemberAction}>
        <input type="hidden" name="locale" value={locale} /><input type="hidden" name="workspace_id" value={workspace.id} /><input type="hidden" name="user_id" value={member.user_id} />
        <RehabConfirmSubmitButton confirmMessage={t("labelRemoveAccessForRecordsAndDataWill", {v0: member.user?.email ?? t("labelThisAccount")})} className="text-sm text-red-700 underline">{t("labelRemoveAccess")}</RehabConfirmSubmitButton>
      </form>}
    </div>;
  })}</div>;
}
