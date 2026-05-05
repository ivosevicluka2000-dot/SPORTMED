"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import DeleteForm from "@/components/admin/DeleteForm";
import {
  upsertDiscountAction,
  deleteDiscountAction,
} from "@/app/[locale]/admin/discounts/_actions";

interface DiscountFormProps {
  discount?: {
    id: string;
    code: string;
    type: "percent" | "fixed";
    value: number;
    valid_from: string | null;
    valid_until: string | null;
    max_uses: number | null;
    used_count: number;
    min_order_amount: number | null;
    active: boolean;
  } | null;
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function DiscountForm({ discount }: DiscountFormProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(upsertDiscountAction, undefined);
  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-200 focus:border-teal focus:outline-none text-sm";

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="space-y-5 bg-white border border-gray-200 rounded-xl p-6"
      >
        {discount?.id && <input type="hidden" name="id" value={discount.id} />}
        <input type="hidden" name="locale" value={locale} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("discounts.code")}
            </label>
            <input
              type="text"
              name="code"
              defaultValue={discount?.code ?? ""}
              required
              className={`${inputClass} uppercase`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("discounts.type")}
            </label>
            <select
              name="type"
              defaultValue={discount?.type ?? "percent"}
              className={inputClass}
            >
              <option value="percent">{t("discounts.typePercent")}</option>
              <option value="fixed">{t("discounts.typeFixed")}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("discounts.value")}
            </label>
            <input
              type="number"
              name="value"
              min={0}
              step={1}
              defaultValue={discount?.value ?? 0}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("discounts.minOrderAmount")}
            </label>
            <input
              type="number"
              name="min_order_amount"
              min={0}
              step={1}
              defaultValue={discount?.min_order_amount ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("discounts.validFrom")}
            </label>
            <input
              type="date"
              name="valid_from"
              defaultValue={toDateInput(discount?.valid_from ?? null)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("discounts.validUntil")}
            </label>
            <input
              type="date"
              name="valid_until"
              defaultValue={toDateInput(discount?.valid_until ?? null)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("discounts.maxUses")}
            </label>
            <input
              type="number"
              name="max_uses"
              min={0}
              step={1}
              defaultValue={discount?.max_uses ?? ""}
              className={inputClass}
            />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              {t("discounts.usedCount")}: {discount?.used_count ?? 0}
            </div>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={discount?.active ?? true}
          />
          {t("discounts.active")}
        </label>

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

      {discount?.id && (
        <DeleteForm
          action={deleteDiscountAction}
          id={discount.id}
          locale={locale}
        />
      )}
    </div>
  );
}
