"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import {
  HeartPulse,
  MapPinned,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Send,
  CheckCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICE_KEYS = [
  { key: "timska-rehabilitacija", icon: HeartPulse, price: 45000 },
  { key: "fizioterapija-na-terenu", icon: MapPinned, price: 35000 },
  { key: "prevencija-povreda", icon: ShieldCheck, price: 30000 },
  { key: "testiranje-performansi", icon: BarChart3, price: 25000 },
] as const;

const LEVELS = ["recreational", "amateur", "semipro", "professional"] as const;

const contactSchema = z.object({
  organization: z.string().min(2),
  contactPerson: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional(),
});

type ContactData = z.infer<typeof contactSchema>;

function formatRSD(amount: number): string {
  return new Intl.NumberFormat("sr-RS").format(amount);
}

export default function B2BProposalBuilder() {
  const t = useTranslations("b2b.proposal");
  const tServices = useTranslations("b2b.services");

  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [sportType, setSportType] = useState("");
  const [teamSize, setTeamSize] = useState(25);
  const [seasonDuration, setSeasonDuration] = useState(10);
  const [competitionLevel, setCompetitionLevel] = useState<string>("amateur");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactData>({
    resolver: zodResolver(contactSchema),
  });

  const toggleService = (key: string) => {
    setSelectedServices((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const estimatedMonthly = SERVICE_KEYS
    .filter((s) => selectedServices.includes(s.key))
    .reduce((acc, s) => acc + s.price, 0);

  const teamMultiplier = teamSize <= 20 ? 1 : teamSize <= 40 ? 1.3 : teamSize <= 60 ? 1.5 : 1.8;
  const adjustedMonthly = Math.round(estimatedMonthly * teamMultiplier);
  const estimatedAnnual = adjustedMonthly * seasonDuration;
  const estimatedSavings = Math.round(estimatedAnnual * 0.35);

  const canProceed = (s: number) => {
    if (s === 1) return selectedServices.length > 0;
    if (s === 2) return teamSize > 0 && competitionLevel !== "";
    return true;
  };

  const onSubmit = async (data: ContactData) => {
    setStatus("sending");
    try {
      const res = await fetch("/api/b2b-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          sportType,
          teamSize: String(teamSize),
          message: `Izabrane usluge: ${selectedServices.join(", ")}. Nivo: ${competitionLevel}. Sezona: ${seasonDuration} mes. ${data.notes || ""}`,
          selectedServices,
          competitionLevel,
          seasonDuration: String(seasonDuration),
        }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div id="proposal">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full border border-teal/30 flex items-center justify-center">
          <FileText className="w-4 h-4 text-teal" />
        </div>
        <h2 className="text-2xl md:text-3xl font-heading font-semibold text-navy">
          {t("title")}
        </h2>
      </div>
      <p className="text-gray-400 mb-8 ml-11">{t("subtitle")}</p>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step === s
                  ? "bg-teal text-white"
                  : step > s
                    ? "bg-teal/20 text-teal"
                    : "bg-gray-100 text-gray-400"
              )}
            >
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            {s < 4 && (
              <div className={cn("w-8 h-0.5", step > s ? "bg-teal/30" : "bg-gray-200")} />
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mb-6">
        {t("stepOf", { current: step, total: 4 })}
      </p>

      <div className="bg-white border border-gray-100 rounded-xl p-6 md:p-8 shadow-[var(--shadow-soft)]">
        <AnimatePresence mode="wait">
          {/* Step 1: Select services */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-heading font-semibold text-navy mb-1">{t("step1Title")}</h3>
              <p className="text-sm text-gray-400 mb-6">{t("step1Subtitle")}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SERVICE_KEYS.map((svc) => {
                  const Icon = svc.icon;
                  const selected = selectedServices.includes(svc.key);
                  return (
                    <button
                      key={svc.key}
                      type="button"
                      onClick={() => toggleService(svc.key)}
                      className={cn(
                        "border rounded-xl p-5 text-left transition-all cursor-pointer",
                        selected
                          ? "border-teal bg-teal-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          selected ? "bg-teal/10" : "bg-gray-100"
                        )}>
                          <Icon className={cn("w-5 h-5", selected ? "text-teal" : "text-gray-400")} />
                        </div>
                        <div>
                          <h4 className={cn("font-heading font-semibold text-sm", selected ? "text-teal" : "text-navy")}>
                            {tServices(`${svc.key}.title`)}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {tServices(`${svc.key}.shortDescription`)}
                          </p>
                          <p className="text-xs text-teal font-medium mt-2">
                            {t("fromPrice", { price: formatRSD(svc.price) })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Team details */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-heading font-semibold text-navy mb-1">{t("step2Title")}</h3>
              <p className="text-sm text-gray-400 mb-6">{t("step2Subtitle")}</p>

              <div className="space-y-6">
                <Input
                  id="proposal-sport"
                  label={t("sportType")}
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value)}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">{t("teamSize")}</label>
                    <span className="text-sm font-semibold text-teal">{teamSize}</span>
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
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">{t("seasonDuration")}</label>
                    <span className="text-sm font-semibold text-teal">{seasonDuration} {t("months")}</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={12}
                    step={1}
                    value={seasonDuration}
                    onChange={(e) => setSeasonDuration(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-3 block">{t("competitionLevel")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setCompetitionLevel(level)}
                        className={cn(
                          "border rounded-lg py-2.5 px-4 text-sm font-medium transition-all cursor-pointer",
                          competitionLevel === level
                            ? "border-teal bg-teal-50 text-teal"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        )}
                      >
                        {t(`levels.${level}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Proposal review */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-heading font-semibold text-navy mb-1">{t("step3Title")}</h3>
              <p className="text-sm text-gray-400 mb-6">{t("step3Subtitle")}</p>

              <div className="space-y-4">
                {/* Selected packages */}
                <div className="border border-gray-100 rounded-lg p-4">
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-3">{t("selectedPackages")}</h4>
                  <div className="space-y-2">
                    {SERVICE_KEYS.filter((s) => selectedServices.includes(s.key)).map((svc) => {
                      const Icon = svc.icon;
                      return (
                        <div key={svc.key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-teal" />
                            <span className="text-sm text-navy font-medium">{tServices(`${svc.key}.title`)}</span>
                          </div>
                          <span className="text-sm text-gray-400">{formatRSD(svc.price)} RSD/{t("months").slice(0, 3)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Estimate summary */}
                <div className="bg-gradient-to-br from-navy to-navy-light rounded-xl p-6 text-white">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-white/50 text-xs mb-1">{t("estimatedMonthly")}</p>
                      <p className="text-xl font-heading font-bold text-teal">{formatRSD(adjustedMonthly)} RSD</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">{t("estimatedAnnual")}</p>
                      <p className="text-xl font-heading font-bold text-white">{formatRSD(estimatedAnnual)} RSD</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-xs mb-1">{t("estimatedRoi")}</p>
                      <p className="text-xl font-heading font-bold text-accent">{formatRSD(estimatedSavings)} RSD</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                    <span className="text-white/50">{t("seasonCoverage")}</span>
                    <span className="text-white font-medium">{seasonDuration} {t("months")}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-white/50">{t("teamSize")}</span>
                    <span className="text-white font-medium">{teamSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-white/50">{t("competitionLevel")}</span>
                    <span className="text-white font-medium">{t(`levels.${competitionLevel}`)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Contact & submit */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-heading font-semibold text-navy mb-1">{t("step4Title")}</h3>
              <p className="text-sm text-gray-400 mb-6">{t("step4Subtitle")}</p>

              {status === "success" ? (
                <div className="text-center py-10">
                  <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
                  <p className="text-lg font-heading font-semibold text-navy mb-2">{t("success")}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      id="proposal-org"
                      label={t("organization")}
                      error={errors.organization?.message}
                      {...register("organization")}
                    />
                    <Input
                      id="proposal-contact"
                      label={t("contactPerson")}
                      error={errors.contactPerson?.message}
                      {...register("contactPerson")}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      id="proposal-email"
                      type="email"
                      label={t("email")}
                      error={errors.email?.message}
                      {...register("email")}
                    />
                    <Input
                      id="proposal-phone"
                      type="tel"
                      label={t("phone")}
                      error={errors.phone?.message}
                      {...register("phone")}
                    />
                  </div>
                  <Textarea
                    id="proposal-notes"
                    label={t("notes")}
                    rows={3}
                    {...register("notes")}
                  />

                  <Button type="submit" size="lg" disabled={status === "sending"}>
                    <Send className="w-4 h-4 mr-2" />
                    {status === "sending" ? t("sending") : t("submit")}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>

                  {status === "error" && (
                    <p className="text-red-500 text-sm">{t("error")}</p>
                  )}
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        {status !== "success" && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("back")}
              </Button>
            ) : (
              <div />
            )}
            {step < 4 && (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed(step)}
              >
                {t("next")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
