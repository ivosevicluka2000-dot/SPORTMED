"use client";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/routing";

export function RehabLanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("rehab");
  const pathname = usePathname();
  const params = useParams();
  const query = useSearchParams();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={t(locale === "sr" ? "switchToEnglish" : "switchToSerbian")}
      className="rounded-md border bg-white px-3 py-2 text-sm text-navy disabled:opacity-50"
      onClick={() =>
        start(() => {
          // The runtime pathname and params always describe the currently matched route.
          router.replace(
            // @ts-expect-error next-intl's route union cannot narrow usePathname dynamically.
            { pathname, params, query: Object.fromEntries(query.entries()) },
            { locale: locale === "sr" ? "en" : "sr" },
          );
        })
      }
    >
      {locale === "sr" ? "EN" : "SR"}
    </button>
  );
}
