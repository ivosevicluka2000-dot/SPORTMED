"use client";

import { useTranslations } from "next-intl";

interface DeleteFormProps {
  action: (formData: FormData) => Promise<void>;
  id: string;
  locale: string;
}

export default function DeleteForm({ action, id, locale }: DeleteFormProps) {
  const t = useTranslations("admin.common");
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(t("confirmDelete"))) e.preventDefault();
      }}
      className="bg-white border border-red-100 rounded-xl p-4 flex items-center justify-between"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="locale" value={locale} />
      <span className="text-sm text-gray-600">{t("confirmDelete")}</span>
      <button
        type="submit"
        className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-md hover:bg-red-50"
      >
        {t("delete")}
      </button>
    </form>
  );
}
