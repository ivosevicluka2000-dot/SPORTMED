import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailConfigStatus } from "@/lib/email";
import { deliverAppointmentEmails } from "@/lib/rehab/appointment-email-worker";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config = getEmailConfigStatus();
  if (!config.resendApiKeyConfigured || !config.emailFromConfigured) {
    return Response.json({ error: "Email is not configured" }, { status: 503 });
  }
  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("rehab_enqueue_due_appointment_reminders");
    if (error) throw new Error("Reminder queue unavailable");
    const result = await deliverAppointmentEmails(admin);
    return Response.json(result);
  } catch {
    console.error("[rehab-email] Queue processing failed");
    return Response.json({ error: "Appointment email processing failed" }, { status: 500 });
  }
}
