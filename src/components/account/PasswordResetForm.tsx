"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { requestPasswordResetAction } from "@/lib/auth-actions";

export default function PasswordResetForm() {
  const t = useTranslations("account.reset");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
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

      {state.success && (
        <p className="text-sm text-green-600" role="status">
          {t("sent")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-navy text-white py-2.5 rounded-md text-sm font-medium tracking-wide hover:bg-navy/90 transition-colors disabled:opacity-50"
      >
        {pending ? t("submitting") : t("submit")}
      </button>

      <div className="text-sm pt-2 text-center">
        <Link href="/nalog/prijava" className="text-teal hover:underline">
          {t("backToLogin")}
        </Link>
      </div>
    </form>
  );
}
