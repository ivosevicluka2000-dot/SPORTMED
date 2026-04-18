"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === "sr" ? "en" : "sr";
    router.replace(pathname as "/", { locale: newLocale });
  };

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-teal transition-colors cursor-pointer"
      aria-label="Switch language"
    >
      <Globe className="w-4 h-4" />
      <span>{locale === "sr" ? "EN" : "SR"}</span>
    </button>
  );
}
