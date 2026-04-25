"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Send, CheckCircle, Shield } from "lucide-react";

export default function ExitIntentPopup() {
  const t = useTranslations("leadCapture");
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [phone, setPhone] = useState("");
  const [hp, setHp] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      if (e.clientY <= 5 && !dismissed && !show) {
        setShow(true);
      }
    },
    [dismissed, show]
  );

  useEffect(() => {
    // Check if already dismissed in this session
    if (sessionStorage.getItem("exitPopupDismissed")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with sessionStorage external state
      setDismissed(true);
      return;
    }

    // Only activate after 5 seconds on page
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseLeave]);

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("exitPopupDismissed", "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Exit intent lead",
          phone,
          email: "",
          message: "Zahtev za poziv — exit intent",
          website: hp,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setTimeout(dismiss, 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-navy/50 backdrop-blur-sm"
            onClick={dismiss}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed z-[60] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm"
          >
            <div className="bg-white rounded-2xl shadow-[var(--shadow-elevated)] p-8 text-center mx-4">
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {status === "success" ? (
                <div className="py-4">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="font-heading font-semibold text-navy">
                    {t("success")}
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-5">
                    <Phone className="w-6 h-6 text-teal" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-navy mb-2">
                    {t("exitTitle")}
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    {t("exitSubtitle")}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-3">
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
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("phone")}
                      required
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 text-center focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="w-full bg-teal text-white font-medium py-3 rounded-lg hover:bg-teal-dark transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {status === "sending" ? t("sending") : t("submit")}
                    </button>

                    {status === "error" && (
                      <p className="text-red-500 text-sm">{t("error")}</p>
                    )}

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-1">
                      <Shield className="w-3.5 h-3.5" />
                      {t("guarantee")}
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
