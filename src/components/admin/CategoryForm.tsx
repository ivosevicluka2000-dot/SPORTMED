"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import BilingualField from "@/components/admin/BilingualField";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteForm from "@/components/admin/DeleteForm";
import {
  upsertCategoryAction,
  deleteCategoryAction,
} from "@/app/[locale]/admin/categories/_actions";

interface CategoryFormProps {
  category?: {
    id: string;
    slug: string;
    title: Record<string, string> | null;
    description: Record<string, string> | null;
    image_url: string | null;
    sort_order: number;
  } | null;
}

export default function CategoryForm({ category }: CategoryFormProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(upsertCategoryAction, undefined);
  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-200 focus:border-teal focus:outline-none text-sm";

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="space-y-5 bg-white border border-gray-200 rounded-xl p-6"
      >
        {category?.id && <input type="hidden" name="id" value={category.id} />}
        <input type="hidden" name="locale" value={locale} />

        <BilingualField
          label={t("categories.title_field")}
          nameSr="title_sr"
          nameEn="title_en"
          defaultSr={category?.title?.sr ?? ""}
          defaultEn={category?.title?.en ?? ""}
          required
        />

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("categories.slug")}
          </label>
          <input
            type="text"
            name="slug"
            defaultValue={category?.slug ?? ""}
            required
            pattern="[a-z0-9\\-]+"
            className={inputClass}
          />
        </div>

        <BilingualField
          label={t("categories.description")}
          type="textarea"
          nameSr="description_sr"
          nameEn="description_en"
          defaultSr={category?.description?.sr ?? ""}
          defaultEn={category?.description?.en ?? ""}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Image
            </label>
            <ImageUploader
              name="image_url"
              bucket="product-images"
              multiple={false}
              initial={category?.image_url ? [category.image_url] : []}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              Sort
            </label>
            <input
              type="number"
              name="sort_order"
              step={1}
              defaultValue={category?.sort_order ?? 0}
              className={inputClass}
            />
          </div>
        </div>

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

      {category?.id && (
        <DeleteForm
          action={deleteCategoryAction}
          id={category.id}
          locale={locale}
        />
      )}
    </div>
  );
}
