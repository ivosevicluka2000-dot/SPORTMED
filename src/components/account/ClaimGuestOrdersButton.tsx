"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { claimGuestOrdersAction } from "@/lib/auth-actions";

export default function ClaimGuestOrdersButton() {
  const t = useTranslations("account.dashboard");
  const [pending, start] = useTransition();
  const [count, setCount] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await claimGuestOrdersAction();
            setCount(result.count);
          })
        }
        className="text-sm border border-gray-200 text-gray-700 px-4 py-2 rounded-md hover:border-gray-300 transition-colors disabled:opacity-50"
      >
        {t("claimGuest")}
      </button>
      {count !== null && (
        <span className="text-sm text-gray-500">{t("claimed", { count })}</span>
      )}
    </div>
  );
}
