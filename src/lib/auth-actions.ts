"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "./supabase/server";
import { getPathname } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";

interface FormState {
  error?: string;
  success?: string;
}

function localePath(locale: Locale, href: Parameters<typeof getPathname>[0]["href"]) {
  return getPathname({ locale, href });
}

export async function signInAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const locale = (formData.get("locale") as Locale) || "sr";
  const next = (formData.get("next") as string) || localePath(locale, "/nalog");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "errorInvalid" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "errorInvalid" };
  redirect(next);
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const locale = (formData.get("locale") as Locale) || "sr";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (password.length < 8) return { error: "errorWeakPassword" };
  if (!email) return { error: "errorGeneric" };

  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
      emailRedirectTo: `${origin}${localePath(locale, "/nalog")}`,
    },
  });
  if (error) {
    if (/registered|exists/i.test(error.message)) return { error: "errorEmailTaken" };
    return { error: "errorGeneric" };
  }
  return { success: "checkEmail" };
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = (formData.get("locale") as Locale) || "sr";
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(localePath(locale, "/"));
}

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const locale = (formData.get("locale") as Locale) || "sr";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "errorGeneric" };

  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}${localePath(locale, "/nalog")}`,
  });
  // Always return success to avoid email enumeration.
  return { success: "sent" };
}

export async function claimGuestOrdersAction(): Promise<{ count: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_guest_orders");
  if (error) return { count: 0 };
  revalidatePath("/", "layout");
  return { count: typeof data === "number" ? data : 0 };
}
