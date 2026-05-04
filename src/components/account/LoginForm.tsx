"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { signInAction } from "@/lib/auth-actions";

export default function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("account.login");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(signInAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={8}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {t(state.error as "errorInvalid" | "errorGeneric")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-navy text-white py-2.5 rounded-md text-sm font-medium tracking-wide hover:bg-navy/90 transition-colors disabled:opacity-50"
      >
        {pending ? t("submitting") : t("submit")}
      </button>

      <div className="flex items-center justify-between text-sm pt-2">
        <Link href="/nalog/oporavak-lozinke" className="text-teal hover:underline">
          {t("forgot")}
        </Link>
        <Link href="/nalog/registracija" className="text-gray-600 hover:text-navy">
          {t("noAccount")} <span className="text-teal">{t("signupLink")}</span>
        </Link>
      </div>
    </form>
  );
}
