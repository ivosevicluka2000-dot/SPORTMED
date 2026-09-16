import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "../email.ts";
import { buildAppointmentEmail, type AppointmentEmailEvent, type AppointmentEmailPayload } from "./appointment-email.ts";

interface EmailJob {
  id: string;
  recipient: string;
  event: AppointmentEmailEvent;
  payload: AppointmentEmailPayload;
  attempts: number;
  claim_token: string;
}

// Server callers supply their service-role client. Kept injectable for offline tests.
export async function deliverAppointmentEmails(
  admin: SupabaseClient,
  scope: { appointmentId?: string; workspaceId?: string; limit?: number } = {},
  send = sendEmail,
) {
  const { data, error } = await admin.rpc("rehab_claim_appointment_emails", {
    p_appointment_id: scope.appointmentId ?? null,
    p_workspace_id: scope.workspaceId ?? null,
    p_limit: scope.limit ?? 2,
  });
  if (error) throw new Error(`Appointment email queue unavailable: ${error.code ?? "database"}`);
  const jobs = (data ?? []) as EmailJob[];
  let sent = 0;
  let failed = 0;
  // Two 10-second requests fit within the scheduler's 30-second HTTP timeout.
  // Rate-limit responses recover through the durable retry queue.
  for (const job of jobs) {
    // Recheck after claiming: another action may have superseded this message.
    const { data: active, error: activeError } = await admin.from("rehab_appointment_emails")
      .select("id").eq("id", job.id).eq("status", "processing").eq("claim_token", job.claim_token).maybeSingle();
    if (activeError) throw new Error("Cannot check appointment email claim");
    if (!active) continue;
    let ok = false;
    try {
      ok = await send({ to: job.recipient, ...buildAppointmentEmail(job.event, job.payload),
        idempotencyKey: `rehab-appointment/${job.id}` });
    } catch {
      // Leave no exception with patient data in logs. The queue retains the attempt.
      ok = false;
    }
    const retryMinutes = [1, 5, 15][Math.min(job.attempts - 1, 2)];
    const { error: updateError } = await admin.from("rehab_appointment_emails").update({
      status: ok ? "sent" : job.attempts >= 4 ? "failed" : "pending",
      sent_at: ok ? new Date().toISOString() : null,
      available_at: new Date(Date.now() + retryMinutes * 60_000).toISOString(),
      locked_at: null,
      last_error: ok ? null : "email_send_failed",
    }).eq("id", job.id).eq("status", "processing").eq("claim_token", job.claim_token);
    if (updateError) throw new Error("Cannot persist appointment email result");
    if (ok) sent++; else failed++;
  }
  return { checked: jobs.length, sent, failed };
}
