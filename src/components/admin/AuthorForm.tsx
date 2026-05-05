"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import BilingualField from "@/components/admin/BilingualField";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteForm from "@/components/admin/DeleteForm";
import {
  upsertAuthorAction,
  deleteAuthorAction,
} from "@/app/[locale]/admin/authors/_actions";

interface AuthorFormProps {
  author?: {
    id: string;
    name: string;
    role: string | null;
    image_url: string | null;
    bio: Record<string, string> | null;
  } | null;
}

export default function AuthorForm({ author }: AuthorFormProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(upsertAuthorAction, undefined);
  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-200 focus:border-teal focus:outline-none text-sm";

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="space-y-5 bg-white border border-gray-200 rounded-xl p-6"
      >
        {author?.id && <input type="hidden" name="id" value={author.id} />}
        <input type="hidden" name="locale" value={locale} />

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("authors.name")}
          </label>
          <input
            type="text"
            name="name"
            defaultValue={author?.name ?? ""}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("authors.role")}
          </label>
          <input
            type="text"
            name="role"
            defaultValue={author?.role ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("authors.image")}
          </label>
          <ImageUploader
            name="image_url"
            bucket="blog-images"
            multiple={false}
            initial={author?.image_url ? [author.image_url] : []}
          />
        </div>

        <BilingualField
          label={t("authors.bio")}
          type="textarea"
          nameSr="bio_sr"
          nameEn="bio_en"
          defaultSr={author?.bio?.sr ?? ""}
          defaultEn={author?.bio?.en ?? ""}
          rows={4}
        />

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="bg-navy text-white px-5 py-2 rounded-md text-sm hover:bg-navy/90 disabled:opacity-60"
          >
            {pending ? t("common.saving") : t("common.save")}
          </button>
          {state?.error && (
            <p className="text-sm text-red-600">
              {t("common.error")}: {state.error}
            </p>
          )}
        </div>
      </form>

      {author?.id && (
        <DeleteForm action={deleteAuthorAction} id={author.id} locale={locale} />
      )}
    </div>
  );
}
