"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Send, CheckCircle, Shield, FileText } from "lucide-react";
import { treatments } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function LeadCapturePopup() {
  const t = useTranslations("leadCapture");
  const tServices = useTranslations("services.items");
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [condition, setCondition] = useState("");
  const [hp, setHp] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: "",
          email,
          treatment: service,
          message: `Zahtev za besplatan PDF protokol — ${service || "Nije izabrano"}${condition ? `\nStanje: ${condition}` : ""}`,
          website: hp,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setService("");
        setCondition("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      {/* Floating CTA Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label={t("title")}
        className={cn(
          "fixed bottom-6 left-6 z-40 flex items-center justify-center gap-2 bg-teal text-white rounded-full shadow-[var(--shadow-elevated)] hover:bg-teal-dark transition-all duration-300 cursor-pointer",
          "w-12 h-12 sm:w-auto sm:h-auto sm:px-5 sm:py-3",
          "hover:shadow-[0_10px_40px_-10px_rgba(0,152,180,0.4)]"
        )}
        style={{ animation: "subtle-pulse 3s ease-in-out infinite" }}
      >
        <FileText className="w-5 h-5 sm:w-4 sm:h-4" />
        <span className="text-sm font-medium hidden sm:inline">{t("title")}</span>
      </button>

      {/* Popup Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed z-50 inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md"
            >
              <div className="bg-white rounded-2xl shadow-[var(--shadow-elevated)] overflow-hidden h-full sm:h-auto flex flex-col">
                {/* Header */}
                <div className="bg-navy p-6 relative">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-teal" />
                    </div>
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-white">
                    {t("title")}
                  </h3>
                  <p className="text-sm text-white/50 mt-1">{t("subtitle")}</p>
                </div>

                {/* Body */}
                <div className="p-6 flex-1">
                  {status === "success" ? (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-7 h-7 text-green-600" />
                      </div>
                      <p className="font-heading font-semibold text-navy text-lg mb-2">
                        {t("success")}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={hp}
                        onChange={(e) => setHp(e.target.value)}
                        aria-hidden="true"
                        className="absolute left-[-9999px] w-px h-px opacity-0 pointer-events-none"
                      />
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5">
                          {t("name")}
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5">
                          {t("email")}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5">
                          {t("service")}
                        </label>
                        <select
                          value={service}
                          onChange={(e) => setService(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-colors"
                        >
                          <option value="">{t("selectService")}</option>
                          {treatments.map((tr) => (
                            <option key={tr.slug} value={tr.slug}>
                              {tServices(`${tr.slug}.title`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1.5">
                          {t("condition")}
                        </label>
                        <textarea
                          value={condition}
                          onChange={(e) => setCondition(e.target.value)}
                          placeholder={t("conditionPlaceholder")}
                          rows={3}
                          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-colors resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={status === "sending"}
                        className="w-full bg-teal text-white font-medium py-3.5 rounded-lg hover:bg-teal-dark transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        {status === "sending" ? t("sending") : t("submit")}
                      </button>

                      {status === "error" && (
                        <p className="text-red-500 text-sm text-center">{t("error")}</p>
                      )}

                      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                        <Shield className="w-3.5 h-3.5" />
                        {t("guarantee")}
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
