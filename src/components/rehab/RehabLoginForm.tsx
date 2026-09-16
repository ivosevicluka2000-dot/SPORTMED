"use client";
import { useTranslations } from "next-intl";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useActionState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  rehabSignInAction,
  type RehabLoginState,
} from "@/lib/rehab/auth-actions";

const initialState: RehabLoginState = {};

export default function RehabLoginForm({ next }: { next?: string }) {
  const t = useTranslations("rehab");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(
    rehabSignInAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next ?? ""} />

      <label className="block">
        <span className="mb-2 block text-[13px] font-semibold text-gray-700">
           {t("labelEmail")} </span>
        <span className="relative block">
        <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-11 pr-4 text-base text-gray-800 outline-none transition hover:border-gray-300 focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10"
        />
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-[13px] font-semibold text-gray-700">
           {t("labelPassword")} </span>
        <span className="relative block">
        <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-11 pr-4 text-base text-gray-800 outline-none transition hover:border-gray-300 focus:border-navy focus:bg-white focus:ring-4 focus:ring-navy/10"
        />
        </span>
      </label>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error === "forbidden"
            ? t("labelThisAccountDoesNotHaveAccessTo")
            : t("labelIncorrectEmailOrPassword")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-dark hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy disabled:opacity-50"
      >
        {pending ? t("signingIn") : t("labelSignIn")}
        <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
      </button>
      <Link href="/nalog/oporavak-lozinke" className="mx-auto block w-fit rounded text-center text-[13px] font-medium text-gray-500 underline-offset-4 transition hover:text-navy hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy">
         {t("labelForgotYourPassword")} </Link>
    </form>
  );
}
