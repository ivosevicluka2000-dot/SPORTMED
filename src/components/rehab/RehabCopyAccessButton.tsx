"use client";
import { useTranslations } from "next-intl";

import { useState } from "react";

export function RehabCopyAccessButton({ email, scope, loginUrl }: { email: string; scope: string; loginUrl: string }) {
  const t = useTranslations("rehab");
  const [result, setResult] = useState("");
  const message = t("labelHelloYouHaveAccessToTheRehab", {v0: loginUrl, v1: email, v2: scope});
  return <div>
    <button type="button" className="text-sm font-medium text-teal hover:underline" onClick={async () => {
      try { await navigator.clipboard.writeText(message); setResult(t("labelMessageCopied")); }
      catch { setResult(t("labelCopyingIsUnavailableSelectAndCopyThe")); }
    }}>{t("labelCopyLoginMessage")}</button>
    {result && <p role="status" className="mt-1 text-xs text-gray-600">{result}</p>}
    {result === t("labelCopyingIsUnavailableSelectAndCopyThe") && <textarea readOnly aria-label={t("labelLoginMessage")} value={message} rows={6} className="mt-2 w-full rounded border p-2 text-xs" />}
  </div>;
}
