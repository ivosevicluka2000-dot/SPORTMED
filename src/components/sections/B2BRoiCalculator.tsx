"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Calculator, ArrowRight } from "lucide-react";

const PRICE_PER_SESSION = 3000;
const B2B_TIERS = [
  { max: 20, monthly: 45000 },
  { max: 40, monthly: 75000 },
  { max: 60, monthly: 95000 },
  { max: 100, monthly: 110000 },
];
const INCLUDED_VALUE_PER_PLAYER = 2000;
const SEASON_MONTHS = 10;

function getB2BMonthly(teamSize: number): number {
  for (const tier of B2B_TIERS) {
    if (teamSize <= tier.max) return tier.monthly;
  }
  return B2B_TIERS[B2B_TIERS.length - 1].monthly;
}

function formatRSD(amount: number): string {
  return new Intl.NumberFormat("sr-RS").format(amount);
}

export default function B2BRoiCalculator() {
  const t = useTranslations("b2b.roi");

  const [teamSize, setTeamSize] = useState(25);
  const [avgInjuries, setAvgInjuries] = useState(8);
  const [sessionsPerInjury, setSessionsPerInjury] = useState(10);

  const individualTotal = avgInjuries * sessionsPerInjury * PRICE_PER_SESSION;
  const b2bMonthly = getB2BMonthly(teamSize);
  const b2bAnnual = b2bMonthly * SEASON_MONTHS;
  const savings = Math.max(0, individualTotal - b2bAnnual);
  const savingsPercent = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;
  const includedValue = teamSize * INCLUDED_VALUE_PER_PLAYER;

  const maxBar = Math.max(individualTotal, b2bAnnual);
  const individualBarWidth = maxBar > 0 ? (individualTotal / maxBar) * 100 : 0;
  const b2bBarWidth = maxBar > 0 ? (b2bAnnual / maxBar) * 100 : 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full border border-teal/30 flex items-center justify-center">
          <Calculator className="w-4 h-4 text-teal" />
        </div>
        <h2 className="text-2xl md:text-3xl font-heading font-semibold text-navy">
          {t("title")}
        </h2>
      </div>
      <p className="text-gray-400 mb-10 ml-11">{t("subtitle")}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Inputs */}
        <div className="space-y-8">
          {/* Team size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-navy">{t("teamSize")}</label>
              <span className="text-sm font-semibold text-teal">{teamSize} {t("players")}</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>10</span>
              <span>100</span>
            </div>
          </div>

          {/* Avg injuries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-navy">{t("avgInjuries")}</label>
              <span className="text-sm font-semibold text-teal">{avgInjuries} {t("injuries")}</span>
            </div>
            <input
              type="range"
              min={2}
              max={30}
              step={1}
              value={avgInjuries}
              onChange={(e) => setAvgInjuries(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>2</span>
              <span>30</span>
            </div>
          </div>

          {/* Sessions per injury */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-navy">{t("sessionsPerInjury")}</label>
              <span className="text-sm font-semibold text-teal">{sessionsPerInjury} {t("sessions")}</span>
            </div>
            <input
              type="range"
              min={5}
              max={20}
              step={1}
              value={sessionsPerInjury}
              onChange={(e) => setSessionsPerInjury(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5</span>
              <span>20</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {/* Comparison bars */}
          <div className="space-y-6 mb-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{t("individualCost")}</span>
                <span className="text-sm font-semibold text-red-500">{formatRSD(individualTotal)} RSD/{t("perYear")}</span>
              </div>
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${individualBarWidth}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {avgInjuries} × {sessionsPerInjury} × {formatRSD(PRICE_PER_SESSION)} RSD {t("perSession")}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{t("b2bCost")}</span>
                <span className="text-sm font-semibold text-teal">{formatRSD(b2bMonthly)} RSD/{t("perMonth")}</span>
              </div>
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-teal rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${b2bBarWidth}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formatRSD(b2bAnnual)} RSD/{t("perYear")} ({SEASON_MONTHS} mes.)
              </p>
            </div>
          </div>

          {/* Savings card */}
          {savings > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-navy to-navy-light rounded-xl p-6 text-center"
            >
              <p className="text-white/50 text-sm mb-1">{t("annualSavings")}</p>
              <p className="text-3xl md:text-4xl font-heading font-bold text-accent mb-1">
                {formatRSD(savings)} RSD
              </p>
              <p className="text-teal text-sm font-medium">
                {t("savingsPercent")}: {savingsPercent}%
              </p>
              <p className="text-white/40 text-xs mt-3">
                {t("plusValue")} {formatRSD(includedValue)} RSD
              </p>
            </motion.div>
          )}

          {/* CTA */}
          <div className="mt-6">
            <a href="#proposal">
              <Button size="lg" className="w-full">
                {t("cta", { savings: `${formatRSD(savings)} RSD` })}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
