"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

type RehabSubmitButtonProps = ComponentPropsWithoutRef<"button"> & {
  pendingLabel?: string;
};

export function RehabSubmitButton({
  children,
  pendingLabel = "Čuvanje...",
  className,
  disabled,
  ...props
}: RehabSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      disabled={disabled || pending}
      className={`${className ?? ""} inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-60`}
    >
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
