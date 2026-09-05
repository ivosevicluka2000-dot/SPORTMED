export type RehabWorkspaceKind = "clinic" | "club";
export type RehabWorkspaceRole = "owner" | "therapist" | "viewer" | "player";

export interface RehabWorkspace {
  id: string;
  slug: string;
  name: string;
  kind: RehabWorkspaceKind;
}

export interface RehabAccessContext {
  userId: string;
  fullName: string;
  isGlobalAdmin: boolean;
  loadError: boolean;
  workspaces: Array<
    RehabWorkspace & {
      role: RehabWorkspaceRole;
      patientId: string | null;
      canEdit: boolean;
      canManage: boolean;
    }
  >;
}

export interface RehabPatient {
  id: string;
  workspace_id: string;
  record_type: "patient" | "player";
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  problem: string | null;
  started_on: string;
  status: "active" | "completed";
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RehabDailyEntry {
  id: string;
  patient_id: string;
  workspace_id: string;
  recorded_on: string;
  condition_summary: string;
  pain_level: number | null;
  therapy: string;
  notes: string | null;
  image_paths: string[];
  created_by: string;
  created_at: string;
}

export interface RehabPlanDay {
  id: string;
  plan_id: string;
  workspace_id: string;
  day_number: number;
  planned_date: string | null;
  instructions: string;
}

export interface RehabPlan {
  id: string;
  patient_id: string;
  workspace_id: string;
  title: string;
  start_date: string;
  end_date: string;
  goal: string | null;
  notes: string | null;
  status: "active" | "completed";
  days?: RehabPlanDay[];
}

export interface RehabAppointment {
  id: string;
  patient_id: string;
  workspace_id: string;
  starts_at: string;
  duration_minutes: number;
  therapy: string | null;
  notes: string | null;
  status: "scheduled" | "completed" | "cancelled";
  reminder_email: string | null;
  reminder_hours_before: number;
  reminder_sent_at: string | null;
  patient?: Pick<RehabPatient, "id" | "first_name" | "last_name" | "email"> | null;
}
