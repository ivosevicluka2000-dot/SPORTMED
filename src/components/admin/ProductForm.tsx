"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import BilingualField from "@/components/admin/BilingualField";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteForm from "@/components/admin/DeleteForm";
import { upsertProductAction, deleteProductAction } from "@/app/[locale]/admin/products/_actions";

interface ProductFormProps {
  product?: {
    id: string;
    slug: string;
    name: Record<string, string> | null;
    description: Record<string, string> | null;
    images: string[] | null;
    price: number;
    compare_at_price: number | null;
    category_id: string | null;
    stock: number;
    featured: boolean;
    active: boolean;
    product_type: "physical" | "pdf";
  } | null;
  categories: Array<{ id: string; slug: string; title: Record<string, string> | null }>;
}

export default function ProductForm({ product, categories }: ProductFormProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(upsertProductAction, undefined);
  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-200 focus:border-teal focus:outline-none text-sm";

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-5 bg-white border border-gray-200 rounded-xl p-6">
        {product?.id && <input type="hidden" name="id" value={product.id} />}
        <input type="hidden" name="locale" value={locale} />

        <BilingualField
          label={t("products.name")}
          nameSr="name_sr"
          nameEn="name_en"
          defaultSr={product?.name?.sr ?? ""}
          defaultEn={product?.name?.en ?? ""}
          required
        />

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("products.slug")}
          </label>
          <input
            type="text"
            name="slug"
            defaultValue={product?.slug ?? ""}
            required
            pattern="[a-z0-9\\-]+"
            className={inputClass}
          />
        </div>

        <BilingualField
          label={t("products.description")}
          type="textarea"
          nameSr="description_sr"
          nameEn="description_en"
          defaultSr={product?.description?.sr ?? ""}
          defaultEn={product?.description?.en ?? ""}
          rows={5}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("products.price")}
            </label>
            <input
              type="number"
              name="price"
              min={0}
              step={1}
              defaultValue={product?.price ?? 0}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("products.compareAtPrice")}
            </label>
            <input
              type="number"
              name="compare_at_price"
              min={0}
              step={1}
              defaultValue={product?.compare_at_price ?? ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("products.stock")}
            </label>
            <input
              type="number"
              name="stock"
              min={0}
              step={1}
              defaultValue={product?.stock ?? 0}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("products.productType")}
            </label>
            <select
              name="product_type"
              defaultValue={product?.product_type ?? "physical"}
              className={inputClass}
            >
              <option value="physical">{t("products.typePhysical")}</option>
              <option value="pdf">{t("products.typePdf")}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("products.category")}
          </label>
          <select
            name="category_id"
            defaultValue={product?.category_id ?? ""}
            className={inputClass}
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title?.[locale] ?? c.title?.sr ?? c.slug}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-2">
            {t("products.images")}
          </label>
          <ImageUploader
            bucket="product-images"
            name="images"
            initial={product?.images ?? []}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured ?? false}
            />
            {t("products.featured")}
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="active"
              defaultChecked={product?.active ?? true}
            />
            {t("products.active")}
            <span className="text-xs text-gray-400">
              ({t("products.activeHint")})
            </span>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
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

      {product?.id && (
        <DeleteForm
          action={deleteProductAction}
          id={product.id}
          locale={locale}
        />
      )}
    </div>
  );
}
