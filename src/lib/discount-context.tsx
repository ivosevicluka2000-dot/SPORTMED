"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

interface DiscountState {
  discountCode: string | null;
  discountPercent: number;
  isActive: boolean;
  /**
   * Validate a code against the server. Pass the current cart subtotal so
   * minimum-order-amount rules can be checked. Resolves true on success.
   */
  applyCode: (code: string, subtotal?: number) => Promise<boolean>;
  clearCode: () => void;
}

const DiscountContext = createContext<DiscountState>({
  discountCode: null,
  discountPercent: 0,
  isActive: false,
  applyCode: async () => false,
  clearCode: () => {},
});

async function validateCodeOnServer(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; percent: number; code?: string } | null> {
  try {
    const res = await fetch("/api/discount/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotal }),
    });
    if (!res.ok) return null;
    return (await res.json()) as {
      valid: boolean;
      percent: number;
      code?: string;
    };
  } catch {
    return null;
  }
}

export function DiscountProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<
    Omit<DiscountState, "applyCode" | "clearCode">
  >({
    discountCode: null,
    discountPercent: 0,
    isActive: false,
  });

  useEffect(() => {
    const code = searchParams.get("discount");
    if (!code) return;
    let cancelled = false;
    void validateCodeOnServer(code, 0).then((result) => {
      if (cancelled || !result?.valid) return;
      setState({
        discountCode: result.code ?? code.toUpperCase(),
        discountPercent: result.percent,
        isActive: true,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const applyCode = useCallback(async (raw: string, subtotal: number = 0) => {
    const trimmed = raw.trim();
    if (!trimmed) return false;
    const result = await validateCodeOnServer(trimmed, subtotal);
    if (!result?.valid) return false;
    setState({
      discountCode: result.code ?? trimmed.toUpperCase(),
      discountPercent: result.percent,
      isActive: true,
    });
    return true;
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
