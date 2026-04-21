"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion } from "framer-motion";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Send, CheckCircle } from "lucide-react";

export default function Newsletter() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
        setTimeout(() => setStatus("idle"), 3500);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3500);
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3500);
    }
  };

  return (
    <Section className="bg-navy relative overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 bg-dot-pattern" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative max-w-xl mx-auto text-center"
      >
        <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white mb-4">
          {t("title")}
        </h2>
        <p className="text-gray-400 text-sm md:text-base mb-10 leading-relaxed">{t("subtitle")}</p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          {/* Honeypot - hidden from real users */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            aria-hidden="true"
            className="absolute left-[-9999px] w-px h-px opacity-0 pointer-events-none"
          />
          <Input
            type="email"
            placeholder={t("placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 bg-navy-light border-white/10 text-white placeholder:text-gray-500 focus:border-teal"
          />
          <Button type="submit" className="whitespace-nowrap" disabled={status === "sending"}>
            {status === "success" ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("success")}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {status === "sending" ? "..." : t("button")}
              </>
            )}
          </Button>
        </form>
        {status === "error" && (
          <p className="mt-3 text-sm text-red-300">{t("error")}</p>
        )}
      </motion.div>
    </Section>
  );
}
