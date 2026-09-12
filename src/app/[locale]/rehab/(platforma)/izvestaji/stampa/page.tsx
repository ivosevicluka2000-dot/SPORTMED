import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getRehabAccessContext } from "@/lib/rehab/access";
import { createClient } from "@/lib/supabase/server";
import { readAllPages, type ReportPerson } from "@/lib/rehab/reports";
import { RehabReportBuilder } from "@/components/rehab/RehabReportBuilder";
import type { Locale } from "@/i18n/routing";
export const dynamic = "force-dynamic";
export default async function ReportPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    workspace?: string;
    patient?: string;
    period?: string;
    type?: string;
  }>;
}) {
  const [{ locale }, q] = await Promise.all([params, searchParams]);
  const access = await getRehabAccessContext(locale as Locale);
  const workspace = access.workspaces.find((w) => w.id === q.workspace);
  if (!workspace) notFound();
  const t = await getTranslations({ locale, namespace: "rehab" });
  const supabase = await createClient();
  let people: ReportPerson[];
  try {
    people = await readAllPages<ReportPerson>((a, b) =>
      supabase
        .from("rehab_patients")
        .select("id,first_name,last_name,status")
        .eq("workspace_id", workspace.id)
        .order("last_name")
        .order("first_name")
        .order("id")
        .range(a, b),
    );
  } catch {
    return <p role="alert">{t("reportLoadError")}</p>;
  }
  if (q.patient && !people.some((p) => p.id === q.patient)) notFound();
  return (
    <div className="rehab-print-page">
      <h1 className="rehab-print-toolbar mb-5 text-2xl font-semibold">
        {workspace.name} · {t("rehabilitationReport")}
      </h1>
      <RehabReportBuilder
        key={`${workspace.id}:${q.patient ?? ""}`}
        locale={locale}
        workspaceId={workspace.id}
        people={people}
        kind={workspace.kind}
        initialPatientId={
          workspace.role === "player"
            ? (workspace.patientId ?? undefined)
            : q.patient
        }
        playerOnly={workspace.role === "player"}
        initialPeriod={q.period}
        initialType={q.type}
      />
    </div>
  );
}
