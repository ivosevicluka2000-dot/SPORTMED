"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Calendar,
  Activity,
  Dumbbell,
  Target,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────

type InjuryKey =
  | "acl"
  | "meniscus"
  | "ankleSprain"
  | "rotatorCuff"
  | "hamstring"
  | "achilles"
  | "stressFracture"
  | "muscleContusion"
  | "tennisElbow"
  | "plantarFasciitis";

type Severity = "mild" | "moderate" | "severe";
type AgeRange = "16-25" | "26-35" | "36-45" | "46+";
type FitnessLevel = "recreational" | "amateur" | "professional";

interface PhaseData {
  key: string;
  weekStart: number;
  weekEnd: number;
  activities: string[];
  services: string[];
}

// ── Recovery data lookup table ────────────────────────

// Base recovery weeks [min, max] per injury × severity
const recoveryData: Record<InjuryKey, Record<Severity, [number, number]>> = {
  acl:              { mild: [12, 16], moderate: [16, 24], severe: [24, 36] },
  meniscus:         { mild: [4, 6],   moderate: [6, 12],  severe: [12, 20] },
  ankleSprain:      { mild: [1, 3],   moderate: [3, 6],   severe: [6, 12] },
  rotatorCuff:      { mild: [4, 8],   moderate: [8, 16],  severe: [16, 24] },
  hamstring:        { mild: [1, 3],   moderate: [3, 8],   severe: [8, 16] },
  achilles:         { mild: [4, 8],   moderate: [8, 12],  severe: [12, 24] },
  stressFracture:   { mild: [4, 8],   moderate: [8, 12],  severe: [12, 20] },
  muscleContusion:  { mild: [1, 2],   moderate: [2, 4],   severe: [4, 8] },
  tennisElbow:      { mild: [4, 8],   moderate: [8, 16],  severe: [16, 24] },
  plantarFasciitis: { mild: [4, 8],   moderate: [8, 16],  severe: [16, 24] },
};

const ageMultipliers: Record<AgeRange, number> = {
  "16-25": 1.0,
  "26-35": 1.05,
  "36-45": 1.15,
  "46+": 1.25,
};

const fitnessMultipliers: Record<FitnessLevel, number> = {
  recreational: 1.05,
  amateur: 1.0,
  professional: 0.9,
};

const injuryKeys: InjuryKey[] = [
  "acl", "meniscus", "ankleSprain", "rotatorCuff", "hamstring",
  "achilles", "stressFracture", "muscleContusion", "tennisElbow", "plantarFasciitis",
];

const severityKeys: Severity[] = ["mild", "moderate", "severe"];
const ageRangeKeys: AgeRange[] = ["16-25", "26-35", "36-45", "46+"];
const fitnessKeys: FitnessLevel[] = ["recreational", "amateur", "professional"];

function calculateRecovery(
  injury: InjuryKey,
  severity: Severity,
  age: AgeRange,
  fitness: FitnessLevel,
  previousInjury: boolean
): [number, number] {
  const [baseMin, baseMax] = recoveryData[injury][severity];
  const ageMult = ageMultipliers[age];
  const fitMult = fitnessMultipliers[fitness];
  const prevMult = previousInjury ? 1.2 : 1.0;

  const min = Math.round(baseMin * ageMult * fitMult * prevMult);
  const max = Math.round(baseMax * ageMult * fitMult * prevMult);

  return [min, max];
}

function generatePhases(totalMin: number, totalMax: number): PhaseData[] {
  const avg = (totalMin + totalMax) / 2;

  // Distribute time across 5 phases proportionally
  const ratios = [0.1, 0.2, 0.3, 0.25, 0.15];
  let cumulative = 0;

  const phases: PhaseData[] = [
    {
      key: "acute",
      weekStart: 0,
      weekEnd: 0,
      activities: ["RICE", "NSAIDs", "Immobilization"],
      services: ["dijagnostika", "fizikalna-terapija"],
    },
    {
      key: "earlyRehab",
      weekStart: 0,
      weekEnd: 0,
      activities: ["ROM exercises", "Gentle stretching", "Pool therapy"],
      services: ["fizikalna-terapija", "manuelna-terapija"],
    },
    {
      key: "strengthening",
      weekStart: 0,
      weekEnd: 0,
      activities: ["Progressive resistance", "Balance training", "Core stability"],
      services: ["kineziterapija", "sportska-rehabilitacija"],
    },
    {
      key: "sportSpecific",
      weekStart: 0,
      weekEnd: 0,
      activities: ["Sport drills", "Agility", "Plyometrics"],
      services: ["sportska-rehabilitacija", "testiranje-merenja"],
    },
    {
      key: "returnToPlay",
      weekStart: 0,
      weekEnd: 0,
      activities: ["Full training", "Match simulation", "Maintenance"],
      services: ["sportska-rehabilitacija", "recovery-terapije"],
    },
  ];

  for (let i = 0; i < phases.length; i++) {
    const start = Math.round(cumulative);
    cumulative += avg * ratios[i];
    const end = Math.round(cumulative);
    phases[i].weekStart = start;
    phases[i].weekEnd = Math.max(end, start + 1);
  }

  return phases;
}

const phaseIcons = [Calendar, Activity, Dumbbell, Target, Trophy];
const phaseColors = [
  "border-red-300 bg-red-50 text-red-600",
  "border-amber-300 bg-amber-50 text-amber-600",
  "border-blue-300 bg-blue-50 text-blue-600",
  "border-teal/30 bg-teal-50 text-teal",
  "border-green-300 bg-green-50 text-green-600",
];

// ── Component ─────────────────────────────────────────

export default function RecoveryEstimator() {
  const t = useTranslations("tools.recoveryEstimator");
  const tServices = useTranslations("services.items");

  const [step, setStep] = useState(1);
  const [injury, setInjury] = useState<InjuryKey | "">("");
  const [severity, setSeverity] = useState<Severity>("moderate");
  const [ageRange, setAgeRange] = useState<AgeRange>("26-35");
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>("amateur");
  const [previousInjury, setPreviousInjury] = useState(false);

  const canProceedStep1 = injury !== "";
  const [minWeeks, maxWeeks] =
    injury !== ""
      ? calculateRecovery(injury, severity, ageRange, fitnessLevel, previousInjury)
      : [0, 0];

  const phases = injury !== "" ? generatePhases(minWeeks, maxWeeks) : [];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3 mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <button
              onClick={() => {
                if (s < step) setStep(s);
                if (s === 3 && step === 2 && canProceedStep1) setStep(3);
              }}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                s === step
                  ? "bg-teal text-white shadow-md"
                  : s < step
                    ? "bg-teal/20 text-teal cursor-pointer hover:bg-teal/30"
                    : "bg-gray-100 text-gray-400"
              )}
            >
              {s}
            </button>
            {s < 3 && (
              <div className={cn(
                "w-12 h-0.5 rounded-full transition-colors",
                s < step ? "bg-teal/40" : "bg-gray-200"
              )} />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-gray-400 mb-8">
        {t("stepOf", { current: step, total: 3 })}
      </p>

      {/* ── STEP 1: Injury selection ─────────── */}
      {step === 1 && (
        <div>
          <h2 className="font-heading text-2xl font-bold text-navy mb-2 text-center">
            {t("step1Title")}
          </h2>
          <p className="text-gray-500 text-center mb-8">{t("step1Subtitle")}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {injuryKeys.map((key) => (
              <button
                key={key}
                onClick={() => setInjury(key)}
                className={cn(
                  "px-4 py-3.5 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer",
                  injury === key
                    ? "border-teal bg-teal-50 text-teal shadow-sm"
                    : "border-gray-200 text-gray-700 hover:border-teal/30 hover:bg-gray-50"
                )}
              >
                {t(`injuries.${key}`)}
              </button>
            ))}
          </div>

          <div className="mt-10 flex justify-end">
            <button
              onClick={() => canProceedStep1 && setStep(2)}
              disabled={!canProceedStep1}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                canProceedStep1
                  ? "bg-teal text-white hover:bg-teal-dark shadow-md"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {t("next")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Severity & personal info ── */}
      {step === 2 && (
        <div>
          <h2 className="font-heading text-2xl font-bold text-navy mb-2 text-center">
            {t("step2Title")}
          </h2>
          <p className="text-gray-500 text-center mb-8">{t("step2Subtitle")}</p>

          <div className="space-y-6">
            {/* Severity */}
            <div>
              <label className="block text-sm font-semibold text-navy mb-3">
                {t("severity")}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {severityKeys.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={cn(
                      "py-3 px-3 rounded-xl border text-sm font-medium text-center transition-all cursor-pointer",
                      severity === s
                        ? "border-teal bg-teal-50 text-teal"
                        : "border-gray-200 text-gray-600 hover:border-teal/30"
                    )}
                  >
                    {t(`severityLevels.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Age range */}
            <div>
              <label className="block text-sm font-semibold text-navy mb-3">
                {t("ageRange")}
              </label>
              <div className="grid grid-cols-4 gap-3">
                {ageRangeKeys.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAgeRange(a)}
                    className={cn(
                      "py-3 px-2 rounded-xl border text-sm font-medium text-center transition-all cursor-pointer",
                      ageRange === a
                        ? "border-teal bg-teal-50 text-teal"
                        : "border-gray-200 text-gray-600 hover:border-teal/30"
                    )}
                  >
                    {t(`ageRanges.${a}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Fitness level */}
            <div>
              <label className="block text-sm font-semibold text-navy mb-3">
                {t("fitnessLevel")}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {fitnessKeys.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFitnessLevel(f)}
                    className={cn(
                      "py-3 px-3 rounded-xl border text-sm font-medium text-center transition-all cursor-pointer",
                      fitnessLevel === f
                        ? "border-teal bg-teal-50 text-teal"
                        : "border-gray-200 text-gray-600 hover:border-teal/30"
                    )}
                  >
                    {t(`fitnessLevels.${f}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Previous injury */}
            <div>
              <label className="block text-sm font-semibold text-navy mb-3">
                {t("previousInjury")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => setPreviousInjury(val)}
                    className={cn(
                      "py-3 px-3 rounded-xl border text-sm font-medium text-center transition-all cursor-pointer",
                      previousInjury === val
                        ? "border-teal bg-teal-50 text-teal"
                        : "border-gray-200 text-gray-600 hover:border-teal/30"
                    )}
                  >
                    {val ? t("yes") : t("no")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-navy transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("back")}
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-teal text-white hover:bg-teal-dark shadow-md transition-all cursor-pointer"
            >
              {t("next")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Results ────────────────── */}
      {step === 3 && injury !== "" && (
        <div>
          <h2 className="font-heading text-2xl font-bold text-navy mb-2 text-center">
            {t("step3Title")}
          </h2>
          <p className="text-gray-500 text-center mb-8">{t("step3Subtitle")}</p>

          {/* Estimated recovery header */}
          <div className="bg-gradient-to-br from-navy to-navy-light rounded-2xl p-8 text-center mb-8">
            <p className="text-teal-light text-sm font-medium uppercase tracking-wide mb-2">
              {t("estimatedRecovery")}
            </p>
            <p className="text-white font-heading text-4xl md:text-5xl font-bold mb-1">
              {minWeeks}–{maxWeeks}
            </p>
            <p className="text-gray-400 text-sm">{t("weeks")}</p>
            <p className="text-gray-400 text-xs mt-3">
              {t(`injuries.${injury}`)} · {t(`severityLevels.${severity}`)}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-10">
            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
              {phases.map((phase, i) => {
                const total = phases[phases.length - 1].weekEnd;
                const width = ((phase.weekEnd - phase.weekStart) / total) * 100;
                return (
                  <div
                    key={phase.key}
                    className={cn(
                      "h-full rounded-full transition-all",
                      i === 0 && "bg-red-400",
                      i === 1 && "bg-amber-400",
                      i === 2 && "bg-blue-400",
                      i === 3 && "bg-teal",
                      i === 4 && "bg-green-500"
                    )}
                    style={{ width: `${width}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-10">
            <h3 className="font-heading text-lg font-semibold text-navy mb-6">
              {t("recoveryTimeline")}
            </h3>
            <div className="space-y-4">
              {phases.map((phase, i) => {
                const Icon = phaseIcons[i];
                return (
                  <div
                    key={phase.key}
                    className={cn(
                      "rounded-xl border-l-4 p-5 bg-white shadow-[var(--shadow-soft)]",
                      phaseColors[i].split(" ")[0]
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        phaseColors[i].split(" ").slice(1).join(" ")
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-navy text-sm">
                            {t(`phases.${phase.key}.title`)}
                          </h4>
                          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                            {t("weeks")} {phase.weekStart}–{phase.weekEnd}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mb-3">
                          {t(`phases.${phase.key}.description`)}
                        </p>

                        {/* Activities */}
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                            {t("keyActivities")}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {phase.activities.map((act) => (
                              <span
                                key={act}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
                              >
                                {act}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Recommended services */}
                        <div>
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                            {t("recommendedServices")}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {phase.services.map((slug) => (
                              <Link
                                key={slug}
                                href={{
                                  pathname: "/usluge/[slug]",
                                  params: { slug },
                                }}
                                className="text-xs bg-teal-50 text-teal px-2 py-0.5 rounded-md hover:bg-teal/10 transition-colors"
                              >
                                {tServices(`${slug}.title`)}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-teal-50 rounded-2xl p-8 text-center mb-8">
            <h3 className="font-heading text-lg font-bold text-navy mb-2">
              {t("bookAssessment")}
            </h3>
            <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
              {t("disclaimer")}
            </p>
            <Link
              href="/prodavnica"
              className="inline-flex items-center gap-2 bg-teal text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-teal-dark transition-colors shadow-md"
            >
              {t("bookAssessment")}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              {t("disclaimer")}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-navy transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("back")}
            </button>
            <button
              onClick={() => {
                setStep(1);
                setInjury("");
                setSeverity("moderate");
                setAgeRange("26-35");
                setFitnessLevel("amateur");
                setPreviousInjury(false);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:text-navy transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {t("startOver")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
