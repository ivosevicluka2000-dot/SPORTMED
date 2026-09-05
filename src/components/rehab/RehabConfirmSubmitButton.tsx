"use client";

import type { ButtonHTMLAttributes } from "react";

type RehabConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage: string;
};

export function RehabConfirmSubmitButton({
  confirmMessage,
  onClick,
  ...props
}: RehabConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    />
  );
}
