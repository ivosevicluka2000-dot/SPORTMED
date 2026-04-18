"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface ServiceFaqProps {
  items: FaqItem[];
  title: string;
}

export default function ServiceFaq({ items, title }: ServiceFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div>
      <h3 className="text-lg font-heading font-semibold text-navy mb-5">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="border border-gray-100 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => toggle(index)}
              className={cn(
                "w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer transition-colors",
                openIndex === index ? "bg-gray-50" : "hover:bg-gray-50/50"
              )}
            >
              <span className="text-sm font-medium text-navy pr-4">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200",
                  openIndex === index && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
