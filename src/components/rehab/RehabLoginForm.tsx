"use client";

import { useActionState } from "react";
import { useLocale } from "next-intl";
import {
  rehabSignInAction,
  type RehabLoginState,
} from "@/lib/rehab/auth-actions";

const initialState: RehabLoginState = {};

export default function RehabLoginForm({ next }: { next?: string }) {
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(
    rehabSignInAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next ?? ""} />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          className="w-full rounded-md border border-gray-200 px-4 py-3 outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          Lozinka
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="w-full rounded-md border border-gray-200 px-4 py-3 outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
        />
      </label>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error === "forbidden"
            ? "Ovaj nalog nema pristup Rehab platformi."
            : "Email ili lozinka nisu ispravni."}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-navy px-5 py-3 text-sm font-medium text-white transition hover:bg-navy-dark disabled:opacity-50"
      >
        {pending ? "Prijavljivanje..." : "Prijavi se"}
      </button>
      <p className="text-center text-xs leading-5 text-gray-500">
        Ako vam je potrebna nova lozinka, obratite se glavnom administratoru.
      </p>
    </form>
  );
}
