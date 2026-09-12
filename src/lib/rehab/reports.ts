import { z } from "zod";
import { isValidRehabDate } from "./dates.ts";
import type { RehabPatient, RehabPlan, RehabDailyEntry } from "./types";

export const reportRequestSchema = z
  .object({
    workspaceId: z.uuid(),
    scope: z.enum(["one", "selected", "all"]),
    ids: z.array(z.uuid()).max(10000),
    status: z.enum(["all", "active", "completed"]),
    period: z.enum(["all", "month", "year", "range"]),
    month: z.string(),
    year: z.string(),
    from: z.string(),
    to: z.string(),
    content: z.enum(["summary", "individual", "both"]),
  })
  .refine(
    (r) =>
      r.scope === "all" ||
      (r.scope === "one" ? r.ids.length === 1 : r.ids.length > 0),
  );
export type ReportRequest = z.infer<typeof reportRequestSchema>;
export type ReportPerson = Pick<
  RehabPatient,
  "id" | "first_name" | "last_name" | "status"
>;
export type ReportCard = Pick<
  RehabPatient,
  | "id"
  | "first_name"
  | "last_name"
  | "record_type"
  | "status"
  | "problem"
  | "started_on"
> & {
  plans: RehabPlan[];
  entries: RehabDailyEntry[];
};
export interface RehabReport {
  workspace: { id: string; name: string; kind: "clinic" | "club" };
  preparedBy: string;
  generatedAt: string;
  from: string | null;
  to: string | null;
  content: ReportRequest["content"];
  cards: ReportCard[];
}
export function reportBounds(
  r: Pick<ReportRequest, "period" | "month" | "year" | "from" | "to">,
): { from: string | null; to: string | null } {
  if (r.period === "all") return { from: null, to: null };
  let from = r.from,
    to = r.to;
  if (r.period === "year") {
    from = `${r.year}-01-01`;
    to = `${r.year}-12-31`;
  }
  if (r.period === "month") {
    from = `${r.month}-01`;
    if (!isValidRehabDate(from)) throw new Error("invalidPeriod");
    const [year, month] = r.month.split("-").map(Number);
    to = new Date(Date.UTC(year, month, 0, 12)).toISOString().slice(0, 10);
  }
  if (!isValidRehabDate(from) || !isValidRehabDate(to) || from > to)
    throw new Error("invalidPeriod");
  return { from, to };
}
export function planOverlaps(
  plan: { start_date: string; end_date: string | null },
  from: string | null,
  to: string | null,
) {
  return (
    (!to || plan.start_date <= to) &&
    (!from || !plan.end_date || plan.end_date >= from)
  );
}
// Advance by the actual response size, so server-side caps never drop records.
export async function readAllPages<T>(
  read: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
  pageSize = 200,
): Promise<T[]> {
  const result: T[] = [];
  for (;;) {
    const { data, error } = await read(
      result.length,
      result.length + pageSize - 1,
    );
    if (error || !data) throw new Error("reportLoadError");
    if (!data.length) return result;
    result.push(...data);
  }
}
