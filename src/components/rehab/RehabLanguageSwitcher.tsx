"use client";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/routing";

export function RehabLanguageSwitcher({ label }: { label?: string } = {}) {
  const locale = useLocale();
  const t = useTranslations("rehab");
  const pathname = usePathname();
  const params = useParams();
  const query = useSearchParams();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div role={label ? "group" : undefined} aria-label={label} className="inline-flex flex-wrap items-center gap-2">
      {label && <span className="text-sm font-medium text-gray-600">{label}</span>}
      <div className="inline-flex shrink-0 gap-1 rounded-lg border border-gray-200 bg-white p-1">
      {(["sr", "en"] as const).map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          disabled={pending}
          aria-pressed={locale === language}
          aria-label={t(language === "en" ? "switchToEnglish" : "switchToSerbian")}
          className={`rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-dark disabled:opacity-50 ${locale === language ? "bg-navy text-white" : "text-gray-600 hover:bg-gray-100 hover:text-navy"}`}
          onClick={() => {
            if (locale === language) return;
            start(() => {
              // The runtime pathname and params always describe the currently matched route.
              router.replace(
                // @ts-expect-error next-intl's route union cannot narrow usePathname dynamically.
                { pathname, params, query: Object.fromEntries(query.entries()) },
                { locale: language, scroll: false },
              );
            });
          }}
        >
          {language === "sr" ? "Srpski" : "English"}
        </button>
      ))}
      </div>
    </div>
  );
}
