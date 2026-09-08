import type { SupabaseClient } from "@supabase/supabase-js";

export const RECOVERY_SITE_URL = "https://www.sportcaremed.com";

// Only accept the recovery token from the URL fragment, never a user ID/email.
// Fragments are not sent to our server or included in HTTP referrers.
export function recoveryTokenFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.has("error") || params.getAll("type").length !== 1 ||
      params.get("type") !== "recovery" || params.getAll("token_hash").length !== 1) return null;
  const token = params.get("token_hash") ?? "";
  return /^[a-zA-Z0-9_-]{16,512}$/.test(token) ? token : null;
}

export function passwordValidation(password: string, confirmation: string) {
  if (password.length < 8 || new TextEncoder().encode(password).length > 72) return "weak";
  if (password !== confirmation) return "mismatch";
  return null;
}

type RecoveryAuth = Pick<SupabaseClient["auth"], "verifyOtp" | "getUser" | "updateUser" | "signOut">;

// The caller supplies a dedicated, non-persistent client, not the site's session.
// An unrelated existing login can never authorize this password-reset flow.
export function createPasswordRecovery(auth: RecoveryAuth) {
  let verifiedUserId: string | null = null;
  return {
    async verify(token: string): Promise<{ email: string } | { error: "invalid" | "network" }> {
      verifiedUserId = null;
      try {
        const result = await auth.verifyOtp({ token_hash: token, type: "recovery" });
        if (result.error || !result.data.session) {
          return { error: result.error?.status === 0 ? "network" : "invalid" };
        }
        const { data, error } = await auth.getUser();
        if (error || !data.user?.email) return { error: "invalid" };
        verifiedUserId = data.user.id;
        return { email: data.user.email };
      } catch {
        return { error: "network" };
      }
    },
    async save(password: string, confirmation: string): Promise<
      "saved" | "invalid" | "weak" | "mismatch" | "same" | "failed"
    > {
      if (!verifiedUserId) return "invalid";
      const validation = passwordValidation(password, confirmation);
      if (validation) return validation;
      try {
        const { data, error } = await auth.getUser();
        if (error || data.user?.id !== verifiedUserId) {
          verifiedUserId = null;
          return "invalid";
        }
        const updated = await auth.updateUser({ password });
        if (updated.error) {
          if (updated.error.code === "same_password") return "same";
          if (updated.error.code === "weak_password") return "weak";
          return "failed";
        }
        verifiedUserId = null;
        // Password is already saved. A logout/network error must not report that
        // the password change itself failed or prompt a second mutation.
        try { await auth.signOut({ scope: "local" }); } catch { /* memory-only session */ }
        return "saved";
      } catch {
        return "failed";
      }
    },
  };
}
