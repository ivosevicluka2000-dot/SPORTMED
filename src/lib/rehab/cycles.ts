import { z } from "zod";
import { isValidRehabDate } from "./dates.ts";

const optionalDate = z
  .union([z.literal(""), z.string().refine(isValidRehabDate)])
  .nullable();
export const cycleSchema = z
  .object({
    id: z.uuid().optional(),
    title: z.string().trim().min(1).max(200),
    goal: z.string().trim().max(1000).nullable(),
    instructions: z.string().trim().min(1).max(10000),
    start_date: optionalDate,
    end_date: optionalDate,
    status: z.enum(["planned", "in_progress", "completed"]),
  })
  .refine((c) => !c.start_date || !c.end_date || c.end_date >= c.start_date);
export const cyclePlanSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    start_date: z.string().refine(isValidRehabDate),
    end_date: optionalDate,
    goal: z.string().trim().max(1000),
    notes: z.string().trim().max(3000),
    cycles: z.array(cycleSchema).min(1).max(100),
  })
  .refine((p) => !p.end_date || p.end_date >= p.start_date)
  .refine(
    (p) =>
      new Set(p.cycles.flatMap((c) => (c.id ? [c.id] : []))).size ===
      p.cycles.filter((c) => c.id).length,
  );
export type CycleInput = z.infer<typeof cycleSchema>;
