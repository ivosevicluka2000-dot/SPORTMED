"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Activity,
  Move,
  Dumbbell,
  Target,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────

type CategoryKey =
  | "painSwelling"
  | "rangeOfMotion"
  | "strengthPower"
  | "sportFunction"
  | "psychologicalReadiness";

interface CategoryConfig {
  key: CategoryKey;
  weight: number;
  icon: typeof Activity;
  color: string;
  bgColor: string;
  items: string[];
}

// ── Category configuration ────────────────────────────

const categories: CategoryConfig[] = [
  {
    key: "painSwelling",
    weight: 0.25,
    icon: Activity,
    color: "text-red-500",
    bgColor: "bg-red-50",
    items: ["noPainRest", "noPainDaily", "noPainSport", "noSwelling", "painLevel"],
  },
  {
    key: "rangeOfMotion",
    weight: 0.2,
    icon: Move,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    items: ["fullRange", "noStiffness", "fullSquat", "allPositions"],
  },
  {
    key: "strengthPower",
    weight: 0.25,
    icon: Dumbbell,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    items: ["strength90", "singleLeg", "jumpLand", "sprintFull", "functionalTests"],
  },
  {
    key: "sportFunction",
    weight: 0.2,
    icon: Target,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    items: ["fullIntensity", "cuttingConfidence", "graduatedProtocol", "noCompensation"],
  },
  {
    key: "psychologicalReadiness",
    weight: 0.1,
    icon: Brain,
    color: "text-teal",
    bgColor: "bg-teal-50",
    items: ["noFear", "mentallyPrepared", "confidence8"],
  },
];

// ── Component ─────────────────────────────────────────

export default function ReadinessChecklist() {
  const t = useTranslations("tools.readinessChecklist");

  // Track checked items per category: { painSwelling: { noPainRest: true, ... }, ... }
  const [checked, setChecked] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {};
    for (const cat of categories) {
      init[cat.key] = {};
      for (const item of cat.items) {
        init[cat.key][item] = false;
      }
    }
    return init;
  });

  const [showResults, setShowResults] = useState(false);

  // Toggle a checklist item
  const toggle = (category: string, item: string) => {
    setChecked((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [item]: !prev[category][item],
      },
    }));
    // Hide results when changing answers
    if (showResults) setShowResults(false);
  };

  // Calculate scores
  const scores = useMemo(() => {
    const categoryScores: Record<string, number> = {};
    let totalChecked = 0;
    let totalItems = 0;

    for (const cat of categories) {
      const catChecked = cat.items.filter((item) => checked[cat.key][item]).length;
      categoryScores[cat.key] = cat.items.length > 0 ? (catChecked / cat.items.length) * 100 : 0;
      totalChecked += catChecked;
      totalItems += cat.items.length;
    }

    // Weighted overall score
    let overall = 0;
    for (const cat of categories) {
      overall += (categoryScores[cat.key] / 100) * cat.weight;
    }
    overall *= 100;

    return { categoryScores, overall, totalChecked, totalItems };
  }, [checked]);

  // Reset everything
  const reset = () => {
    const init: Record<string, Record<string, boolean>> = {};
    for (const cat of categories) {
      init[cat.key] = {};
      for (const item of cat.items) {
        init[cat.key][item] = false;
      }
    }
    setChecked(init);
    setShowResults(false);
  };

  // Get status color/label/icon based on percentage
  const getStatus = (pct: number) => {
    if (pct >= 80) return { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", ring: "stroke-green-500" };
    if (pct >= 60) return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", ring: "stroke-amber-500" };
    return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", ring: "stroke-red-500" };
  };

  // Weak categories for recommendations
  const weakCategories = categories.filter(
    (cat) => scores.categoryScores[cat.key] < 80
  );

  return (
    <div className="space-y-8">
      {/* Category sections */}
      {categories.map((cat) => {
        const catChecked = cat.items.filter((item) => checked[cat.key][item]).length;
        const Icon = cat.icon;

        return (
          <div
            key={cat.key}
            className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
          >
            {/* Category header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cat.bgColor)}>
                  <Icon className={cn("w-5 h-5", cat.color)} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-navy text-sm">
                    {t(`categories.${cat.key}.title`)}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {t(`categories.${cat.key}.description`)}
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-400">
                {t("itemsChecked", { checked: catChecked, total: cat.items.length })}
              </span>
            </div>

            {/* Checklist items */}
            <div className="divide-y divide-gray-50">
              {cat.items.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-3 px-6 py-3.5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={checked[cat.key][item]}
                      onChange={() => toggle(cat.key, item)}
                      className="sr-only peer"
                    />
                    <div className={cn(
                      "w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center",
                      checked[cat.key][item]
                        ? "bg-teal border-teal"
                        : "border-gray-300 peer-focus-visible:border-teal"
                    )}>
                      {checked[cat.key][item] && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm transition-colors",
                    checked[cat.key][item] ? "text-navy" : "text-gray-600"
                  )}>
                    {t(`categories.${cat.key}.items.${item}`)}
                  </span>
                </label>
              ))}
            </div>

            {/* Category progress bar */}
            <div className="px-6 py-3 bg-gray-50/50">
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    scores.categoryScores[cat.key] >= 80 ? "bg-green-500" :
                    scores.categoryScores[cat.key] >= 60 ? "bg-amber-500" : "bg-red-400"
                  )}
                  style={{ width: `${scores.categoryScores[cat.key]}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Show results button */}
      {!showResults && (
        <div className="text-center">
          <button
            onClick={() => setShowResults(true)}
            className="inline-flex items-center gap-2 bg-teal text-white px-8 py-3 rounded-full font-medium hover:bg-teal/90 transition-colors"
          >
            {t("showResults")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Results section */}
      {showResults && (
        <div className="space-y-8 animate-[fadeUp_0.5s_ease-out]">
          {/* Overall readiness circle */}
          <div className={cn(
            "rounded-2xl border p-8 text-center",
            getStatus(scores.overall).bg,
            getStatus(scores.overall).border
          )}>
            <h2 className="font-heading text-lg font-semibold text-navy mb-6">
              {t("overallReadiness")}
            </h2>

            {/* Circular progress */}
            <div className="relative w-40 h-40 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  className={getStatus(scores.overall).ring}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(scores.overall / 100) * 327} 327`}
                  style={{ transition: "stroke-dasharray 0.8s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-3xl font-bold", getStatus(scores.overall).color)}>
                  {Math.round(scores.overall)}%
                </span>
              </div>
            </div>

            {/* Status message */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {scores.overall >= 80 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : scores.overall >= 60 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={cn("font-semibold text-lg", getStatus(scores.overall).color)}>
                {scores.overall >= 80
                  ? t("ready")
                  : scores.overall >= 60
                  ? t("almostReady")
                  : t("notReady")}
              </span>
            </div>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {scores.overall >= 80
                ? t("readyText")
                : scores.overall >= 60
                ? t("almostReadyText")
                : t("notReadyText")}
            </p>
          </div>

          {/* Category breakdown */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="font-heading font-semibold text-navy mb-5">
              {t("categoryBreakdown")}
            </h3>
            <div className="space-y-4">
              {categories.map((cat) => {
                const pct = scores.categoryScores[cat.key];
                const status = getStatus(pct);
                const Icon = cat.icon;

                return (
                  <div key={cat.key} className="flex items-center gap-4">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", cat.bgColor)}>
                      <Icon className={cn("w-4 h-4", cat.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-navy truncate">
                          {t(`categories.${cat.key}.title`)}
                        </span>
                        <span className={cn("text-sm font-semibold", status.color)}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            pct >= 80 ? "bg-green-500" :
                            pct >= 60 ? "bg-amber-500" : "bg-red-400"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations for weak categories */}
          {weakCategories.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-heading font-semibold text-navy">
                  {scores.overall < 80 ? t("almostReady") : t("categoryBreakdown")}
                </h3>
              </div>
              <ul className="space-y-3">
                {weakCategories.map((cat) => (
                  <li key={cat.key} className="flex items-start gap-2">
                    <span className={cn("font-medium text-sm", cat.color)}>
                      {t(`categories.${cat.key}.title`)}:
                    </span>
                    <span className="text-sm text-gray-600">
                      {t(`recommendations.${cat.key}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          {scores.overall < 80 && (
            <div className="text-center rounded-2xl border border-gray-200 bg-white p-8">
              <p className="text-gray-600 mb-4 text-sm">
                {t("bookSession")}
              </p>
              <Link
                href="/prodavnica"
                className="inline-flex items-center gap-2 bg-teal text-white px-6 py-3 rounded-full font-medium hover:bg-teal/90 transition-colors"
              >
                {t("bookSession")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              {t("disclaimer")}
            </p>
          </div>

          {/* Reset button */}
          <div className="text-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-navy text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t("resetChecklist")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
