"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface BilingualFieldProps {
  label: string;
  /** "input" (single line) or "textarea" (multi line) */
  type?: "input" | "textarea";
  nameSr: string;
  nameEn: string;
  defaultSr?: string;
  defaultEn?: string;
  required?: boolean;
  rows?: number;
}

/**
 * Bilingual SR/EN editor with tabs. Renders two hidden-label inputs
 * (named `nameSr` and `nameEn`) so a parent <form> picks both up.
 */
export default function BilingualField({
  label,
  type = "input",
  nameSr,
  nameEn,
  defaultSr = "",
  defaultEn = "",
  required = false,
  rows = 4,
}: BilingualFieldProps) {
  const t = useTranslations("admin.common");
  const [tab, setTab] = useState<"sr" | "en">("sr");

  const baseInputClass =
    "w-full px-3 py-2 rounded-md border border-gray-200 focus:border-teal focus:outline-none text-sm";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-navy">{label}</label>
        <div className="inline-flex rounded-md border border-gray-200 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setTab("sr")}
            className={`px-3 py-1 ${
              tab === "sr" ? "bg-navy text-white" : "bg-white text-gray-700"
            }`}
          >
            {t("languageSr")}
          </button>
          <button
            type="button"
            onClick={() => setTab("en")}
            className={`px-3 py-1 ${
              tab === "en" ? "bg-navy text-white" : "bg-white text-gray-700"
            }`}
          >
            {t("languageEn")}
          </button>
        </div>
      </div>
      <div className={tab === "sr" ? "" : "hidden"}>
        {type === "textarea" ? (
          <textarea
            name={nameSr}
            defaultValue={defaultSr}
            required={required}
            rows={rows}
            className={baseInputClass}
          />
        ) : (
          <input
            type="text"
            name={nameSr}
            defaultValue={defaultSr}
            required={required}
            className={baseInputClass}
          />
        )}
      </div>
      <div className={tab === "en" ? "" : "hidden"}>
        {type === "textarea" ? (
          <textarea
            name={nameEn}
            defaultValue={defaultEn}
            required={required}
            rows={rows}
            className={baseInputClass}
          />
        ) : (
          <input
            type="text"
            name={nameEn}
            defaultValue={defaultEn}
            required={required}
            className={baseInputClass}
          />
        )}
      </div>
    </div>
  );
}
