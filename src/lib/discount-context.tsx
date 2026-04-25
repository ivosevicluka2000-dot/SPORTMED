"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

interface DiscountState {
  discountCode: string | null;
  discountPercent: number;
  isActive: boolean;
  applyCode: (code: string) => boolean;
  clearCode: () => void;
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
  applyCode: () => false,
  clearCode: () => {},
});

export function DiscountProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<Omit<DiscountState, "applyCode" | "clearCode">>({
    discountCode: null,
    discountPercent: 0,
    isActive: false,
  });

  useEffect(() => {
    const code = searchParams.get("discount")?.toUpperCase();
    if (code && DISCOUNT_CODES[code]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing state with URL search params (external)
      setState({
        discountCode: code,
        discountPercent: DISCOUNT_CODES[code],
        isActive: true,
      });
    }
  }, [searchParams]);

  const applyCode = useCallback((raw: string) => {
    const code = raw.trim().toUpperCase();
    if (code && DISCOUNT_CODES[code]) {
      setState({
        discountCode: code,
        discountPercent: DISCOUNT_CODES[code],
        isActive: true,
      });
      return true;
    }
    return false;
  }, []);

  const clearCode = useCallback(() => {
    setState({ discountCode: null, discountPercent: 0, isActive: false });
  }, []);

  return (
    <DiscountContext.Provider value={{ ...state, applyCode, clearCode }}>
      {children}
    </DiscountContext.Provider>
  );
}

export function useDiscount() {
  return useContext(DiscountContext);
}
