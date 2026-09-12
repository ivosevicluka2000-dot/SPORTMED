"use client";
import { useTranslations } from "next-intl";


import { useEffect, useState, type ComponentPropsWithoutRef } from "react";

type RehabFormProps = Omit<
  ComponentPropsWithoutRef<"form">,
  "action" | "onInput" | "onSubmit"
> & {
  action: (formData: FormData) => void | Promise<void>;
  warnOnUnsaved?: boolean;
};

export function RehabForm({
  action,
  children,
  warnOnUnsaved = true,
  ...props
}: RehabFormProps) {
  const t = useTranslations("rehab");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!warnOnUnsaved || !dirty) return;

    const message = t("labelYouHaveUnsavedChangesDoYouWant");
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
    };
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      if (!window.confirm(message)) event.preventDefault();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [dirty, warnOnUnsaved, t]);

  return (
    <form
      action={action}
      onInput={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
      {...props}
    >
      {children}
    </form>
  );
}
