"use client";

import { Printer } from "lucide-react";

export function PrintPlanButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-dark"
    >
      <Printer className="h-4 w-4" />
      Štampaj / sačuvaj PDF
    </button>
  );
}
