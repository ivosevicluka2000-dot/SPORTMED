"use client";
import { useTranslations } from "next-intl";


import { RehabLanguageSwitcher } from "./RehabLanguageSwitcher";
import { Printer } from "lucide-react";

export function PrintPlanButton() {
  const t = useTranslations("rehab");
  return (
    <div className="flex items-center gap-3"><RehabLanguageSwitcher /><button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark"
    >
      <Printer className="h-4 w-4" />
       {t("labelPrintSavePDF")} </button></div>
  );
}
