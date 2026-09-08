"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { createPasswordRecovery, recoveryTokenFromHash } from "@/lib/password-recovery";

type Phase = "loading" | "confirm" | "invalid" | "ready" | "saved";

export default function NewPasswordForm() {
  const t = useTranslations("account.newPassword");
  const [phase, setPhase] = useState<Phase>("loading");
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const token = useRef<string | null | undefined>(undefined);
  const recovery = useRef<ReturnType<typeof createPasswordRecovery> | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    if (token.current === undefined) {
      token.current = recoveryTokenFromHash(window.location.hash);
      // Remove credentials and untrusted query params before rendering links.
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
    Promise.resolve().then(() => {
      if (active) setPhase(token.current ? "confirm" : "invalid");
    });
    return () => { active = false; };
  }, []);

  async function verify() {
    if (!token.current || busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      if (!recovery.current) {
        const client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: "sportcare-password-recovery" } },
        );
        recovery.current = createPasswordRecovery(client.auth);
      }
      const result = await recovery.current.verify(token.current);
      if ("error" in result) {
        if (result.error === "network") setError("network");
        else setPhase("invalid");
      } else {
        token.current = null;
        setEmail(result.email);
        setPhase("ready");
      }
    } catch {
      setError("network");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recovery.current || phase !== "ready" || busy.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    busy.current = true;
    setPending(true);
    setError("");
    try {
      const result = await recovery.current.save(
        String(values.get("password") ?? ""), String(values.get("confirmation") ?? ""),
      );
      if (result === "saved") {
        form.reset();
        recovery.current = null;
        setPhase("saved");
      } else if (result === "invalid") setPhase("invalid");
      else setError(result);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const buttonClass = "w-full rounded-md bg-navy px-5 py-3 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50";
  const inputClass = "mt-1 block w-full rounded-md border border-gray-300 px-4 py-3 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal";
  return (
    <div className="space-y-5">
      {phase === "loading" && <p role="status">{t("loading")}</p>}
      {phase === "confirm" && <>
        <p className="text-sm leading-6 text-gray-600">{t("confirmIntro")}</p>
        <button type="button" onClick={verify} disabled={pending} className={buttonClass}>
          {pending ? t("loading") : t("continue")}
        </button>
      </>}
      {phase === "invalid" && <>
        <p role="alert" className="rounded-md bg-amber-50 p-4 text-sm leading-6 text-amber-900">{t("invalid")}</p>
        <Link href="/nalog/oporavak-lozinke" className="block text-center text-teal underline">{t("newLink")}</Link>
      </>}
      {phase === "ready" && <form onSubmit={save} className="space-y-4">
        <p className="break-all rounded-md bg-gray-50 p-3 text-sm">{t("account")} <strong>{email}</strong></p>
        <label className="block text-sm font-medium">
          {t("password")}
          <input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} disabled={pending} aria-describedby="password-hint" className={inputClass} />
        </label>
        <p id="password-hint" className="text-xs leading-5 text-gray-500">{t("hint")}</p>
        <label className="block text-sm font-medium">
          {t("confirmation")}
          <input name="confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={72} disabled={pending} className={inputClass} />
        </label>
        <button type="submit" disabled={pending} className={buttonClass}>{pending ? t("saving") : t("save")}</button>
      </form>}
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{t(error)}</p>}
      {phase === "saved" && <>
        <p role="status" className="rounded-md bg-green-50 p-4 text-sm leading-6 text-green-800">{t("saved")}</p>
        <Link href="/admin" className={`${buttonClass} block text-center`}>{t("adminLogin")}</Link>
        <Link href="/rehab/prijava" className="block text-center text-teal underline">{t("rehabLogin")}</Link>
        <Link href="/nalog/prijava" className="block text-center text-sm text-gray-600 underline">{t("accountLogin")}</Link>
      </>}
    </div>
  );
}
