"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

interface DiscountState {
  discountCode: string | null;
  discountPercent: number;
  isActive: boolean;
}

const DISCOUNT_CODES: Record<string, number> = {
  SPORT10: 10,
  SPORT20: 20,
  DOBRODOSLI: 15,
};

const DiscountContext = createContext<DiscountState>({
  discountCode: null,
  discountPercent: 0,
  isActive: false,
});

export function DiscountProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<DiscountState>({
    discountCode: null,
    discountPercent: 0,
    isActive: false,
  });

  useEffect(() => {
    const code = searchParams.get("discount")?.toUpperCase();
    if (code && DISCOUNT_CODES[code]) {
      setState({
        discountCode: code,
        discountPercent: DISCOUNT_CODES[code],
        isActive: true,
      });
    }
  }, [searchParams]);

  return (
    <DiscountContext.Provider value={state}>{children}</DiscountContext.Provider>
  );
}

export function useDiscount() {
  return useContext(DiscountContext);
}
