"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { uploadClubLogo } from "@/lib/rehab/branding-actions";
import { MAX_CLUB_LOGO_BYTES } from "@/lib/rehab/branding";

export function RehabClubLogoForm({ locale, workspaceId }: { locale: string; workspaceId: string }) {
  const t = useTranslations("rehab");
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  return <form className="mt-5 border-t pt-4" onSubmit={event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setSaved(false);
    const file = data.get("logo");
    if (!(file instanceof File) || !file.size || file.size > MAX_CLUB_LOGO_BYTES) {
      setError("invalidClubLogo");
      return;
    }
    startTransition(async () => {
      try {
        const result = await uploadClubLogo(locale, workspaceId, data);
        if (result.error) setError(result.error);
        else { setSaved(true); form.reset(); }
      } catch { setError("clubLogoSaveError"); }
    });
  }}>
    <label className="block text-sm font-medium">
      {t("clubLogo")}
      <input className="mt-2 block w-full text-sm" name="logo" type="file" accept="image/png,image/jpeg,image/webp" required disabled={busy}
        onChange={() => { setError(""); setSaved(false); }} />
    </label>
    <p className="mt-2 text-xs text-gray-500">{t("clubLogoHelp")}</p>
    <button disabled={busy} className="mt-3 rounded-md border px-4 py-2 text-sm font-medium text-navy disabled:opacity-50">
      {busy ? t("labelSaving") : t("saveClubLogo")}
    </button>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{t(error)}</p>}
    {saved && <p role="status" className="mt-2 text-sm text-teal-dark">{t("clubLogoSaved")}</p>}
  </form>;
}
