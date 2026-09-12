"use server";

import { getRehabAccessContext } from "./access";
import { createClient } from "@/lib/supabase/server";
import {
  reportRequestSchema,
  reportBounds,
  planOverlaps,
  readAllPages,
  type RehabReport,
  type ReportCard,
} from "./reports";
import type { RehabDailyEntry, RehabPlan } from "./types";

export async function loadRehabReport(
  locale: string,
  input: unknown,
): Promise<
  { report: RehabReport; error?: never } | { error: string; report?: never }
> {
  const parsed = reportRequestSchema.safeParse(input);
  if (!parsed.success) return { error: "invalidSelection" };
  const request = parsed.data;
  const access = await getRehabAccessContext(locale === "en" ? "en" : "sr");
  const workspace = access.workspaces.find((w) => w.id === request.workspaceId);
  if (!workspace || access.loadError) return { error: "reportAccessDenied" };
  if (
    workspace.role === "player" &&
    (request.scope !== "one" ||
      request.ids.length !== 1 ||
      request.ids[0] !== workspace.patientId)
  )
    return { error: "reportAccessDenied" };
  try {
    const { from, to } = reportBounds(request);
    const supabase = await createClient();
    const persons = await readAllPages<Omit<ReportCard, "plans" | "entries">>(
      (a, b) =>
        supabase
          .from("rehab_patients")
          .select(
            "id,first_name,last_name,record_type,status,problem,started_on",
          )
          .eq("workspace_id", workspace.id)
          .order("last_name")
          .order("first_name")
          .order("id")
          .range(a, b),
    );
    const requestedIds = new Set(request.ids);
    if (
      request.scope !== "all" &&
      request.ids.some((id) => !persons.some((p) => p.id === id))
    )
      return { error: "reportAccessDenied" };
    const cards: ReportCard[] = persons
      .filter(
        (p) =>
          (request.scope === "all" || requestedIds.has(p.id)) &&
          (request.status === "all" || p.status === request.status),
      )
      .map((p) => ({ ...p, plans: [], entries: [] }));
    if (!cards.length) return { error: "noReportPeople" };
    const byId = new Map(cards.map((c) => [c.id, c]));
    // Bounded IN clauses and paginated grouped reads, never one request per card.
    for (let offset = 0; offset < cards.length; offset += 100) {
      const ids = cards.slice(offset, offset + 100).map((c) => c.id);
      const [plans, entries] = await Promise.all([
        readAllPages<RehabPlan>((a, b) =>
          supabase
            .from("rehab_plans")
            .select("*,cycles:rehab_plan_cycles(*),days:rehab_plan_days(*)")
            .eq("workspace_id", workspace.id)
            .in("patient_id", ids)
            .order("start_date", { ascending: false })
            .order("id")
            .range(a, b),
        ),
        readAllPages<RehabDailyEntry>((a, b) => {
          let q = supabase
            .from("rehab_daily_entries")
            .select(
              "id,patient_id,workspace_id,recorded_on,condition_summary,pain_level,therapy,notes,image_paths,created_by,created_at",
            )
            .eq("workspace_id", workspace.id)
            .in("patient_id", ids)
            .order("recorded_on", { ascending: false })
            .order("id");
          if (from) q = q.gte("recorded_on", from);
          if (to) q = q.lte("recorded_on", to);
          return q.range(a, b);
        }),
      ]);
      for (const plan of plans)
        if (planOverlaps(plan, from, to))
          byId.get(plan.patient_id)?.plans.push(plan);
      for (const entry of entries)
        byId.get(entry.patient_id)?.entries.push(entry);
    }
    return {
      report: {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          kind: workspace.kind,
        },
        preparedBy: access.fullName,
        generatedAt: new Date().toISOString(),
        from,
        to,
        content: request.content,
        cards,
      },
    };
  } catch (error) {
    return {
      error:
        error instanceof Error && error.message === "invalidPeriod"
          ? "invalidPeriod"
          : "reportLoadError",
    };
  }
}
