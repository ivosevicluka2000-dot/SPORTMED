"use client";

import { Phone } from "lucide-react";

export default function FloatingContact() {
  return (
    <a
      href="tel:+381691982215"
      className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-teal rounded-full flex items-center justify-center shadow-[var(--shadow-soft)] hover:bg-teal-dark transition-all duration-300 hover:shadow-[var(--shadow-elevated)]"
      style={{ animation: "subtle-pulse 3s ease-in-out infinite" }}
      aria-label="Call us"
    >
      <Phone className="w-5 h-5 text-white" />
    </a>
  );
}
