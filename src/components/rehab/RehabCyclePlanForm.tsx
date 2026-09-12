"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveRehabCyclePlanAction } from "@/app/[locale]/admin/rehab/_actions";
import type { RehabPlan } from "@/lib/rehab/types";
import type { CycleInput } from "@/lib/rehab/cycles";
import { dateInputValue } from "@/lib/rehab/dates";
import { RehabForm } from "./RehabForm";
import { RehabSubmitButton } from "./RehabSubmitButton";
import { rehabInputClass, rehabLabelClass } from "./RehabUi";

const emptyCycle = (): CycleInput => ({
  title: "",
  goal: "",
  instructions: "",
  start_date: "",
  end_date: "",
  status: "planned",
});

export function RehabCyclePlanForm({
  locale,
  workspaceId,
  patientId,
  plan,
  legacyPlan,
}: {
  locale: string;
  workspaceId: string;
  patientId: string;
  plan?: RehabPlan;
  legacyPlan?: RehabPlan;
}) {
  const t = useTranslations("rehab");
  const source = plan ?? legacyPlan;
  const [cycles, setCycles] = useState<Array<CycleInput & { key: string }>>(
    () =>
      (plan?.cycles?.length
        ? [...plan.cycles].sort((a, b) => a.cycle_number - b.cycle_number)
        : [emptyCycle()]
      ).map((c, i) => ({ ...c, key: `initial-${i}` })),
  );
  function update(index: number, patch: Partial<CycleInput>) {
    setCycles((previous) =>
      previous.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }
  function move(index: number, delta: number) {
    setCycles((previous) => {
      const next = [...previous];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }
  return (
    <RehabForm action={saveRehabCyclePlanAction} className="mt-4 space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="patient_id" value={patientId} />
      {plan && <input type="hidden" name="plan_id" value={plan.id} />}
      <input
        type="hidden"
        name="cycles"
        value={JSON.stringify(
          cycles.map(({ key, ...c }) => {
            void key;
            return c;
          }),
        )}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className={rehabLabelClass}>{t("planTitle")} *</span>
          <input
            name="title"
            required
            maxLength={200}
            defaultValue={source?.title}
            className={rehabInputClass}
          />
        </label>
        <label>
          <span className={rehabLabelClass}>{t("start")} *</span>
          <input
            name="start_date"
            type="date"
            required
            defaultValue={plan?.start_date ?? dateInputValue()}
            className={rehabInputClass}
          />
        </label>
        <label>
          <span className={rehabLabelClass}>{t("optionalEnd")}</span>
          <input
            name="end_date"
            type="date"
            defaultValue={plan?.end_date ?? ""}
            className={rehabInputClass}
          />
        </label>
      </div>
      <label className="block">
        <span className={rehabLabelClass}>{t("planGoal")}</span>
        <input
          name="goal"
          maxLength={1000}
          defaultValue={source?.goal ?? ""}
          className={rehabInputClass}
        />
      </label>
      {legacyPlan && (
        <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="mb-3 font-semibold">{t("legacyConversionHelp")}</p>
          {legacyPlan.days?.map((day) => (
            <p key={day.id} className="mb-2 whitespace-pre-wrap">
              {t("day")} {day.day_number} · {day.planned_date}:{" "}
              {day.instructions}
            </p>
          ))}
        </aside>
      )}
      <p className="text-sm text-gray-600">{t("cycleHelp")}</p>
      {cycles.map((cycle, index) => (
        <fieldset
          key={cycle.key}
          className="space-y-3 rounded-lg border border-gray-200 bg-white p-4"
        >
          <legend className="px-2 font-semibold text-navy">
            {t("cycle")} {index + 1}
          </legend>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={index === 0}
              onClick={(e) => {
                move(index, -1);
                e.currentTarget.form?.dispatchEvent(
                  new Event("input", { bubbles: true }),
                );
              }}
              className="text-sm text-teal-dark disabled:opacity-30"
            >
              ↑ {t("moveUp")}
            </button>
            <button
              type="button"
              disabled={index === cycles.length - 1}
              onClick={(e) => {
                move(index, 1);
                e.currentTarget.form?.dispatchEvent(
                  new Event("input", { bubbles: true }),
                );
              }}
              className="text-sm text-teal-dark disabled:opacity-30"
            >
              ↓ {t("moveDown")}
            </button>
            <button
              type="button"
              disabled={cycles.length === 1}
              onClick={(e) => {
                if (window.confirm(t("removeCycleConfirm"))) {
                  setCycles((c) => c.filter((_, i) => i !== index));
                  e.currentTarget.form?.dispatchEvent(
                    new Event("input", { bubbles: true }),
                  );
                }
              }}
              className="ml-auto text-sm text-red-700 disabled:opacity-30"
            >
              {t("removeCycle")}
            </button>
          </div>
          <label className="block">
            <span className={rehabLabelClass}>{t("cycleTitle")} *</span>
            <input
              required
              maxLength={200}
              value={cycle.title}
              onChange={(e) => update(index, { title: e.target.value })}
              className={rehabInputClass}
            />
          </label>
          <label className="block">
            <span className={rehabLabelClass}>{t("cycleGoal")}</span>
            <input
              maxLength={1000}
              value={cycle.goal ?? ""}
              onChange={(e) => update(index, { goal: e.target.value })}
              className={rehabInputClass}
            />
          </label>
          <label className="block">
            <span className={rehabLabelClass}>{t("instructions")} *</span>
            <textarea
              aria-label={`${t("instructions")} *`}
              required
              rows={5}
              maxLength={10000}
              value={cycle.instructions}
              onChange={(e) => update(index, { instructions: e.target.value })}
              className={rehabInputClass}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label>
              <span className={rehabLabelClass}>{t("optionalStart")}</span>
              <input
                type="date"
                value={cycle.start_date ?? ""}
                onChange={(e) => update(index, { start_date: e.target.value })}
                className={rehabInputClass}
              />
            </label>
            <label>
              <span className={rehabLabelClass}>{t("optionalEnd")}</span>
              <input
                type="date"
                min={cycle.start_date || undefined}
                value={cycle.end_date ?? ""}
                onChange={(e) => update(index, { end_date: e.target.value })}
                className={rehabInputClass}
              />
            </label>
            <label>
              <span className={rehabLabelClass}>{t("status")}</span>
              <select
                value={cycle.status}
                onChange={(e) =>
                  update(index, {
                    status: e.target.value as CycleInput["status"],
                  })
                }
                className={rehabInputClass}
              >
                {["planned", "in_progress", "completed"].map((s) => (
                  <option key={s} value={s}>
                    {t(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>
      ))}
      <button
        type="button"
        disabled={cycles.length >= 100}
        className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
        onClick={(e) => {
          setCycles((c) => [
            ...c,
            { ...emptyCycle(), key: crypto.randomUUID() },
          ]);
          e.currentTarget.form?.dispatchEvent(
            new Event("input", { bubbles: true }),
          );
        }}
      >
        + {t("addCycle")}
      </button>
      <label className="block">
        <span className={rehabLabelClass}>{t("notes")}</span>
        <textarea
          name="notes"
          rows={2}
          maxLength={3000}
          defaultValue={source?.notes ?? ""}
          className={rehabInputClass}
        />
      </label>
      <RehabSubmitButton className="rounded-md bg-navy px-5 py-3 text-sm text-white">
        {t("savePlan")}
      </RehabSubmitButton>
    </RehabForm>
  );
}
