"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-teal mb-3">
          {t("eyebrow")}
        </p>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-4">
          {t("title")}
        </h1>
        <p className="text-gray-600 mb-8">{t("description")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-white font-medium hover:bg-navy/90 transition-colors cursor-pointer"
          >
            {t("retry")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-gray-800 font-medium hover:bg-gray-50 transition-colors"
          >
            {t("home")}
          </Link>
        </div>
      </div>
    </section>
  );
}
