"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const switchLocale = () => {
    const newLocale = locale === "sr" ? "en" : "sr";
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- pathname from usePathname is valid at runtime
        { pathname, params },
        { locale: newLocale }
      );
    });
  };

  return (
    <button
      onClick={switchLocale}
      disabled={isPending}
      className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-teal transition-colors cursor-pointer disabled:opacity-50"
      aria-label="Switch language"
    >
      <Globe className="w-4 h-4" />
      <span>{locale === "sr" ? "EN" : "SR"}</span>
    </button>
  );
}
