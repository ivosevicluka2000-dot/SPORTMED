import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPathname, type Locale } from "@/i18n/routing";
import type {
  RehabAccessContext,
  RehabWorkspace,
  RehabWorkspaceRole,
} from "./types";

type AccessLevel = "read" | "edit" | "manage";

function canRole(role: RehabWorkspaceRole, level: AccessLevel): boolean {
  if (level === "read") return true;
  if (level === "edit") return role === "owner" || role === "therapist";
  return role === "owner";
}

async function getAuthenticatedUser(locale: Locale) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = getPathname({ locale, href: "/rehab" });
    const loginPath = getPathname({ locale, href: "/rehab/prijava" });
    redirect(`${loginPath}?next=${encodeURIComponent(next)}`);
  }

  return { supabase, user };
}

export async function getRehabAccessContext(
  locale: Locale
): Promise<RehabAccessContext> {
  const { supabase, user } = await getAuthenticatedUser(locale);
  const [profileResult, workspacesResult, membershipsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("rehab_workspaces")
        .select("id, slug, name, kind")
        .order("kind", { ascending: true }),
      supabase
        .from("rehab_workspace_members")
        .select("workspace_id, role, patient_id")
        .eq("user_id", user.id),
    ]);
  const { data: profile } = profileResult;
  const { data: workspaces } = workspacesResult;
  const { data: memberships } = membershipsResult;

  const isGlobalAdmin = profile?.role === "admin";
  const membershipMap = new Map<
    string,
    { role: RehabWorkspaceRole; patientId: string | null }
  >(
    ((memberships ?? []) as Array<{
      workspace_id: string;
      role: RehabWorkspaceRole;
      patient_id: string | null;
    }>).map((membership) => [
      membership.workspace_id,
      { role: membership.role, patientId: membership.patient_id },
    ])
  );

  const accessible = ((workspaces ?? []) as RehabWorkspace[])
    .filter((workspace) => isGlobalAdmin || membershipMap.has(workspace.id))
    .map((workspace) => {
    const membership = membershipMap.get(workspace.id);
    const role = isGlobalAdmin ? "owner" : membership?.role ?? "viewer";
    return {
      ...workspace,
      role,
      patientId: isGlobalAdmin ? null : membership?.patientId ?? null,
      canEdit: isGlobalAdmin || canRole(role, "edit"),
      canManage: isGlobalAdmin || canRole(role, "manage"),
    };
    });

  return {
    userId: user.id,
    fullName: profile?.full_name ?? user.email ?? "",
    isGlobalAdmin,
    loadError: Boolean(
      profileResult.error || workspacesResult.error || membershipsResult.error
    ),
    workspaces: accessible,
  };
}

export async function requireRehabWorkspace(
  locale: Locale,
  workspaceId: string,
  level: AccessLevel = "read"
) {
  const { supabase, user } = await getAuthenticatedUser(locale);
  const [{ data: profile }, { data: workspace }, { data: membership }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("rehab_workspaces")
        .select("id, slug, name, kind")
        .eq("id", workspaceId)
        .maybeSingle(),
      supabase
        .from("rehab_workspace_members")
        .select("role, patient_id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (!workspace) throw new Error("Nemate pristup ovom radnom prostoru.");

  const isGlobalAdmin = profile?.role === "admin";
  const role = (isGlobalAdmin ? "owner" : membership?.role) as
    | RehabWorkspaceRole
    | undefined;

  if (!role || (!isGlobalAdmin && !canRole(role, level))) {
    throw new Error("Nemate dozvolu za ovu radnju.");
  }

  return {
    supabase,
    userId: user.id,
    isGlobalAdmin,
    role,
    patientId: isGlobalAdmin ? null : membership?.patient_id ?? null,
    workspace: workspace as RehabWorkspace,
  };
}

export function selectRehabWorkspace(
  context: RehabAccessContext,
  requestedId?: string | null
) {
  if (requestedId) {
    const selected = context.workspaces.find((item) => item.id === requestedId);
    if (selected) return selected;
  }
  return context.workspaces[0] ?? null;
}
