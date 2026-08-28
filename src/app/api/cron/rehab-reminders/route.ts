import { createAdminClient } from "@/lib/supabase/admin";
import { sendRehabAppointmentReminder } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { data, error } = await admin
    .from("rehab_appointments")
    .select(
      "id, starts_at, reminder_email, reminder_hours_before, patient:rehab_patients(first_name, last_name), workspace:rehab_workspaces(name)"
    )
    .eq("status", "scheduled")
    .is("reminder_sent_at", null)
    .not("reminder_email", "is", null)
    .gt("starts_at", now.toISOString())
    .lte("starts_at", horizon.toISOString())
    .order("starts_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("[rehab-reminders] query failed", error.message);
    return Response.json({ error: "Reminder query failed" }, { status: 500 });
  }

  type DueRow = {
    id: string;
    starts_at: string;
    reminder_email: string;
    reminder_hours_before: number;
    patient: { first_name: string; last_name: string } | null;
    workspace: { name: string } | null;
  };
  const due = ((data ?? []) as unknown as DueRow[]).filter((appointment) => {
    const sendAt =
      new Date(appointment.starts_at).getTime() -
      appointment.reminder_hours_before * 60 * 60 * 1000;
    return sendAt <= now.getTime();
  });

  let sent = 0;
  let failed = 0;
  for (const appointment of due) {
    if (!appointment.patient || !appointment.workspace || !appointment.reminder_email) {
      failed += 1;
      continue;
    }

    const claimedAt = new Date().toISOString();
    const { data: claimed } = await admin
      .from("rehab_appointments")
      .update({ reminder_sent_at: claimedAt })
      .eq("id", appointment.id)
      .is("reminder_sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) continue;

    const ok = await sendRehabAppointmentReminder({
      to: appointment.reminder_email,
      patientName: `${appointment.patient.first_name} ${appointment.patient.last_name}`,
      workspaceName: appointment.workspace.name,
      startsAt: appointment.starts_at,
    });
    if (ok) {
      sent += 1;
    } else {
      failed += 1;
      await admin
        .from("rehab_appointments")
        .update({ reminder_sent_at: null })
        .eq("id", appointment.id)
        .eq("reminder_sent_at", claimedAt);
    }
  }

  return Response.json({ checked: due.length, sent, failed });
}
