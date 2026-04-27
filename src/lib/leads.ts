import { writeClient } from "./sanity";

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
  };
}

/**
 * Persist a lead document to Sanity. Failures are logged but do not throw,
 * so the originating form submission still succeeds for the user even if
 * the CMS write is temporarily unavailable.
 */
export async function createLead(input: LeadInput): Promise<boolean> {
  if (!writeClient) {
    console.warn(
      "[leads] SANITY_API_WRITE_TOKEN not configured; skipping lead persistence"
    );
    return false;
  }
  try {
    await writeClient.create({
      _type: "lead",
      source: input.source,
      name: input.name,
      phone: input.phone,
      email: input.email,
      service: input.service,
      message: input.message,
      metadata: input.metadata,
      status: "new",
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("[leads] Failed to persist lead:", err);
    return false;
  }
}
