"use client";

import { useTranslations, useLocale } from "next-intl";
import { signOutAction } from "@/lib/auth-actions";

export default function SignOutButton({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const t = useTranslations("account.nav");
  const locale = useLocale();
  return (
    <form action={signOutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        className={
          className ??
          "text-sm border border-gray-200 text-gray-700 px-4 py-2 rounded-md hover:border-gray-300 transition-colors"
        }
      >
        {label ?? t("logout")}
      </button>
    </form>
  );
}
