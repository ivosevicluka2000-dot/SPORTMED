"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/routing";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-teal mb-3">
          Error
        </p>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-8">
          Došlo je do greške. Pokušajte ponovo ili se vratite na početnu stranu.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-white font-medium hover:bg-navy/90 transition-colors"
          >
            Pokušaj ponovo
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-gray-800 font-medium hover:bg-gray-50 transition-colors"
          >
            Početna
          </Link>
        </div>
      </div>
    </section>
  );
}
