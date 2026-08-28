"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPathname, type Locale } from "@/i18n/routing";
import { safeRehabNext } from "@/lib/rehab/redirects";

export type RehabLoginState = {
  error?: "invalid" | "forbidden";
};

function localeFrom(formData: FormData): Locale {
  return formData.get("locale") === "en" ? "en" : "sr";
}

export async function rehabSignInAction(
  _previousState: RehabLoginState,
  formData: FormData
): Promise<RehabLoginState> {
  const locale = localeFrom(formData);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeRehabNext(locale, String(formData.get("next") ?? ""));

  if (!email || !password) return { error: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "invalid" };

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle(),
    supabase
      .from("rehab_workspace_members")
      .select("workspace_id")
      .eq("user_id", data.user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  if (profile?.role !== "admin" && !membership) {
    await supabase.auth.signOut();
    return { error: "forbidden" };
  }

  redirect(next);
}

export async function rehabSignOutAction(formData: FormData): Promise<void> {
  const locale = localeFrom(formData);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(getPathname({ locale, href: "/rehab/prijava" }));
}
