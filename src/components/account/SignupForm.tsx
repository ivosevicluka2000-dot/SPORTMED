"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { signUpAction } from "@/lib/auth-actions";

export default function SignupForm() {
  const t = useTranslations("account.signup");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(signUpAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          {t("fullName")}
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
        />
      </div>

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
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          {t("phone")}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
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
          minLength={8}
          autoComplete="new-password"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-md focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {t(state.error as "errorEmailTaken" | "errorWeakPassword" | "errorGeneric")}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-green-600" role="status">
          {t("checkEmail")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-navy text-white py-2.5 rounded-md text-sm font-medium tracking-wide hover:bg-navy/90 transition-colors disabled:opacity-50"
      >
        {pending ? t("submitting") : t("submit")}
      </button>

      <div className="text-sm pt-2 text-center text-gray-600">
        {t("haveAccount")}{" "}
        <Link href="/nalog/prijava" className="text-teal hover:underline">
          {t("loginLink")}
        </Link>
      </div>
    </form>
  );
}
