import { createAdminClient } from "@/lib/supabase/admin";

export interface LeadInput {
  source: "contact" | "b2b" | "lead-capture-popup" | "exit-intent";
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  message?: string;
  metadata?: {
    page?: string;
    locale?: string;
    userAgent?: string;
    referrer?: string;
    service?: string;
  };
}

type DbLeadSource = "contact" | "b2b" | "popup" | "exit_intent";

function toDbLeadSource(source: LeadInput["source"]): DbLeadSource {
  if (source === "lead-capture-popup") return "popup";
  if (source === "exit-intent") return "exit_intent";
  return source;
}

/**
 * Persist a lead row to Supabase. Failures are logged but do not throw,
 * so the originating form submission still succeeds for the user even if
 * the database write is temporarily unavailable.
 */
export async function createLead(input: LeadInput): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("leads").insert({
      source: toDbLeadSource(input.source),
      name: input.name ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      message: input.message ?? null,
      metadata: {
        ...(input.metadata ?? {}),
        ...(input.service ? { service: input.service } : {}),
      },
      status: "new",
    });
    if (error) {
      console.error("[leads] Insert failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[leads] Failed to persist lead:", err);
    return false;
  }
}
