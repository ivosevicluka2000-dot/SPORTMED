"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

export default function ClearCartOnConfirmation() {
  const { clearCart } = useCart();

  useEffect(() => {
    try {
      sessionStorage.removeItem("scm-pending-order");
    } catch {
      // ignore
    }
    clearCart();
  }, [clearCart]);

  return null;
}
