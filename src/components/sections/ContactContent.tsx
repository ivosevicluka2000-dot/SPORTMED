"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { Phone, Mail, MapPin, Send, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

const Instagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const Facebook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
import { treatments } from "@/lib/utils";

const contactSchema = z.object({
  condition: z.string().min(5),
  treatment: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  message: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const TOTAL_STEPS = 3;

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export default function ContactContent() {
  const t = useTranslations("contact");
  const tServices = useTranslations("services");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [hp, setHp] = useState(""); // honeypot

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
  });

  const goNext = async () => {
    let valid = false;
    if (step === 1) {
      valid = await trigger(["condition"]);
    } else if (step === 2) {
      valid = await trigger(["name", "email", "phone"]);
    }
    if (valid) {
      setDirection(1);
      setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const onSubmit = async (data: ContactFormData) => {
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          message: `[Stanje: ${data.condition}]${data.message ? `\n\n${data.message}` : ""}`,
          website: hp,
        }),
      });
      if (res.ok) {
        setStatus("success");
        reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-navy py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <span className="h-px w-8 bg-gold" />
            <span className="text-xs uppercase tracking-[0.2em] text-gold font-medium">
              Sport Care Med
            </span>
            <span className="h-px w-8 bg-gold" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold text-white mb-5"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/60 max-w-xl mx-auto"
          >
            {t("subtitle")}
          </motion.p>
        </div>
      </section>

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="bg-white border border-gray-100 rounded-xl p-8 md:p-10 shadow-[var(--shadow-soft)]">
                {status === "success" ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-heading font-semibold text-navy text-xl mb-2">
                      {t("form.success")}
                    </h3>
                  </div>
                ) : (
                  <>
                    {/* Progress bar */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-400 font-medium">
                          {t("form.stepOf", { current: step, total: TOTAL_STEPS })}
                        </span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-teal rounded-full"
                          initial={false}
                          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        />
                      </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
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
                      <div className="min-h-[320px]">
                        <AnimatePresence mode="wait" custom={direction}>
                          {/* Step 1: What's bothering you */}
                          {step === 1 && (
                            <motion.div
                              key="step1"
                              custom={direction}
                              variants={stepVariants}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                              <h3 className="font-heading font-semibold text-navy text-lg mb-1">
                                {t("form.step1Title")}
                              </h3>
                              <p className="text-sm text-gray-400 mb-6">
                                {t("form.step1Subtitle")}
                              </p>
                              <div className="space-y-5">
                                <Textarea
                                  id="condition"
                                  label={t("form.condition")}
                                  placeholder={t("form.conditionPlaceholder")}
                                  error={errors.condition?.message}
                                  rows={4}
                                  {...register("condition")}
                                />
                                <div className="w-full">
                                  <label
                                    htmlFor="treatment"
                                    className="block text-xs uppercase tracking-wider text-gray-500 mb-2"
                                  >
                                    {t("form.treatment")}
                                  </label>
                                  <select
                                    id="treatment"
                                    {...register("treatment")}
                                    className="w-full rounded-md border border-gray-200 px-4 py-3 text-gray-900 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-colors"
                                  >
                                    <option value="">
                                      {t("form.selectTreatment")}
                                    </option>
                                    {treatments.map((tr) => (
                                      <option key={tr.slug} value={tr.slug}>
                                        {tServices(`items.${tr.slug}.title`)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Step 2: Contact details */}
                          {step === 2 && (
                            <motion.div
                              key="step2"
                              custom={direction}
                              variants={stepVariants}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                              <h3 className="font-heading font-semibold text-navy text-lg mb-1">
                                {t("form.step2Title")}
                              </h3>
                              <p className="text-sm text-gray-400 mb-6">
                                {t("form.step2Subtitle")}
                              </p>
                              <div className="space-y-5">
                                <Input
                                  id="name"
                                  label={t("form.name")}
                                  error={errors.name?.message}
                                  {...register("name")}
                                />
                                <Input
                                  id="email"
                                  type="email"
                                  label={t("form.email")}
                                  error={errors.email?.message}
                                  {...register("email")}
                                />
                                <Input
                                  id="phone"
                                  type="tel"
                                  label={t("form.phone")}
                                  error={errors.phone?.message}
                                  {...register("phone")}
                                />
                              </div>
                            </motion.div>
                          )}

                          {/* Step 3: Additional notes */}
                          {step === 3 && (
                            <motion.div
                              key="step3"
                              custom={direction}
                              variants={stepVariants}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                              <h3 className="font-heading font-semibold text-navy text-lg mb-1">
                                {t("form.step3Title")}
                              </h3>
                              <p className="text-sm text-gray-400 mb-6">
                                {t("form.step3Subtitle")}
                              </p>
                              <Textarea
                                id="message"
                                label={t("form.message")}
                                placeholder={t("form.messagePlaceholder")}
                                error={errors.message?.message}
                                rows={5}
                                {...register("message")}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Navigation buttons */}
                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                        <div>
                          {step > 1 && (
                            <button
                              type="button"
                              onClick={goBack}
                              className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-navy transition-colors cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              {t("form.back")}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {status === "error" && (
                            <p className="text-red-500 text-sm font-medium">
                              {t("form.error")}
                            </p>
                          )}
                          {step < TOTAL_STEPS ? (
                            <Button type="button" onClick={goNext}>
                              {t("form.next")}
                              <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              type="submit"
                              disabled={status === "sending"}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {status === "sending"
                                ? t("form.sending")
                                : t("form.submit")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Contact Info */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="border border-gray-100 rounded-xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    {t("info.phone")}
                  </h3>
                  <a
                    href="tel:+381691982215"
                    className="text-navy font-medium hover:text-teal transition-colors"
                  >
                    +381 69 1982215
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="border border-gray-100 rounded-xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    {t("info.email")}
                  </h3>
                  <a
                    href="mailto:info@sportcaremed.com"
                    className="text-navy font-medium hover:text-teal transition-colors"
                  >
                    info@sportcaremed.com
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="border border-gray-100 rounded-xl p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-teal/30 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-teal" />
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Šabac
                  </h3>
                  <p className="text-navy font-medium">Srbija</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="border border-gray-100 rounded-xl p-6"
            >
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-3">
                {t("info.social")}
              </h3>
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/sport.care.med"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-teal hover:text-teal transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-teal hover:text-teal transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Map */}
      <div className="h-[400px]">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d45129.32548803!2d19.67!3d44.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x475bca7d728e8dad%3A0xa3d1e92b80a3e4e0!2z0KjQsNCx0LDRhg!5e0!3m2!1ssr!2srs!4v1"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Sport Care Med location"
        />
      </div>
    </>
  );
}
