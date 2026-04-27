"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { Calculator, ArrowRight } from "lucide-react";

// Bulk discount tiers based on total order size (players × items per player)
const DISCOUNT_TIERS: { maxPlayers: number; discount: number }[] = [
  { maxPlayers: 20, discount: 0.15 },
  { maxPlayers: 40, discount: 0.22 },
  { maxPlayers: 60, discount: 0.28 },
  { maxPlayers: 1000, discount: 0.32 },
];

function getDiscount(teamSize: number): number {
  for (const tier of DISCOUNT_TIERS) {
    if (teamSize <= tier.maxPlayers) return tier.discount;
  }
  return DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1].discount;
}

function formatRSD(amount: number): string {
  return new Intl.NumberFormat("sr-RS").format(amount);
}

export default function B2BRoiCalculator() {
  const t = useTranslations("b2b.roi");

  const [teamSize, setTeamSize] = useState(25);
  const [productsPerPlayer, setProductsPerPlayer] = useState(4);
  const [avgRetailPrice, setAvgRetailPrice] = useState(2500);

  const totalUnits = teamSize * productsPerPlayer;
  const retailTotal = totalUnits * avgRetailPrice;
  const discount = getDiscount(teamSize);
  const bulkTotal = Math.round(retailTotal * (1 - discount));
  const savings = Math.max(0, retailTotal - bulkTotal);
  const savingsPercent = Math.round(discount * 100);

  const maxBar = Math.max(retailTotal, bulkTotal);
  const retailBarWidth = maxBar > 0 ? (retailTotal / maxBar) * 100 : 0;
  const bulkBarWidth = maxBar > 0 ? (bulkTotal / maxBar) * 100 : 0;

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

          {/* Items per player */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-navy">{t("productsPerPlayer")}</label>
              <span className="text-sm font-semibold text-teal">{productsPerPlayer} {t("items")}</span>
            </div>
            <input
              type="range"
              min={2}
              max={12}
              step={1}
              value={productsPerPlayer}
              onChange={(e) => setProductsPerPlayer(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>2</span>
              <span>12</span>
            </div>
          </div>

          {/* Average retail price */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-navy">{t("avgRetailPrice")}</label>
              <span className="text-sm font-semibold text-teal">{formatRSD(avgRetailPrice)} RSD</span>
            </div>
            <input
              type="range"
              min={1000}
              max={6000}
              step={250}
              value={avgRetailPrice}
              onChange={(e) => setAvgRetailPrice(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1.000</span>
              <span>6.000</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {/* Comparison bars */}
          <div className="space-y-6 mb-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{t("retailTotal")}</span>
                <span className="text-sm font-semibold text-red-500">{formatRSD(retailTotal)} RSD</span>
              </div>
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${retailBarWidth}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {teamSize} × {productsPerPlayer} × {formatRSD(avgRetailPrice)} RSD
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{t("bulkTotal")}</span>
                <span className="text-sm font-semibold text-teal">{formatRSD(bulkTotal)} RSD</span>
              </div>
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-teal rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${bulkBarWidth}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {t("discountTier")}: {savingsPercent}% ({totalUnits} {t("items")})
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
