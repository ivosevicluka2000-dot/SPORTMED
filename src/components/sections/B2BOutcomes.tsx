"use client";

import { useTranslations } from "next-intl";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { Link } from "@/i18n/routing";
import Button from "@/components/ui/Button";
import {
  Trophy,
  ArrowRight,
  CircleDot,
  Target,
  Footprints,
} from "lucide-react";

const sportIcons = [CircleDot, Target, Footprints];

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const numericMatch = value.match(/^(\d+)/);
    if (!numericMatch) {
      setDisplay(value);
      return;
    }
    const target = parseInt(numericMatch[1]);
    const remaining = value.slice(numericMatch[1].length);
    const duration = 1500;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += target / steps;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setDisplay(`${Math.round(current)}${remaining}`);
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-heading font-bold text-teal">
      {display}{suffix}
    </div>
  );
}

export default function B2BOutcomes() {
  const t = useTranslations("b2b.outcomes");

  const stats = t.raw("stats") as { value: string; label: string }[];
  const caseStudies = t.raw("caseStudies.items") as {
    team: string;
    sport: string;
    challenge: string;
    solution: string;
    result: string;
  }[];

  return (
    <>
      {/* Stats strip */}
      <section className="bg-gradient-to-r from-navy via-navy-light to-navy py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <AnimatedCounter value={stat.value} />
                <div className="text-sm text-white/50 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case studies */}
      <div className="mt-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full border border-teal/30 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-teal" />
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-semibold text-navy">
            {t("caseStudies.title")}
          </h2>
        </div>
        <p className="text-gray-400 mb-10 ml-11">{t("subtitle")}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {caseStudies.map((cs, i) => {
            const Icon = sportIcons[i % sportIcons.length];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-gray-100 rounded-xl overflow-hidden"
              >
                <div className="bg-navy p-5">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-teal" />
                    <div>
                      <h3 className="font-heading font-semibold text-white text-sm">
                        {cs.team}
                      </h3>
                      <Badge variant="teal" className="mt-1">{cs.sport}</Badge>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Izazov</span>
                    <p className="text-sm text-gray-600 mt-1">{cs.challenge}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Rešenje</span>
                    <p className="text-sm text-gray-600 mt-1">{cs.solution}</p>
                  </div>
                  <div className="bg-accent/5 rounded-lg p-3">
                    <span className="text-xs uppercase tracking-wider text-accent font-medium">Rezultat</span>
                    <p className="text-sm text-navy font-medium mt-1">{cs.result}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link href="/kontakt">
            <Button variant="outline">
              Započnite partnerstvo
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
