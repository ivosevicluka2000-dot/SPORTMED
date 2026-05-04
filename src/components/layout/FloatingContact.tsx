"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const PRIMARY_PHONE = "+381691982215";
const SECONDARY_PHONE = "+36203115201";
// WhatsApp/Viber expect numbers without the leading "+"
const WHATSAPP_NUMBER = PRIMARY_PHONE.replace(/[^\d]/g, "");
const VIBER_NUMBER = PRIMARY_PHONE;

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
  </svg>
);

const ViberIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.177.693 6.7.623 9.82c-.06 3.11-.13 8.95 5.5 10.541v2.42s-.038.97.602 1.17c.79.25 1.24-.5 1.99-1.3.41-.44.97-1.09 1.39-1.59 3.85.32 6.81-.42 7.15-.53.78-.25 5.2-.82 5.92-6.68.74-6.04-.36-9.86-2.34-11.58l-.01-.005c-.6-.55-3-2.296-8.37-2.316 0 0-.396-.025-1.26-.024zm.067 1.697c.733-.004 1.075.02 1.075.02 4.542.016 6.717 1.385 7.225 1.847 1.674 1.434 2.53 4.88 1.904 9.93-.595 4.892-4.18 5.201-4.838 5.41-.282.09-2.882.736-6.155.522 0 0-2.44 2.944-3.202 3.71-.118.122-.259.171-.354.146-.137-.034-.174-.197-.172-.435l.02-4.025c-4.766-1.327-4.488-6.297-4.438-8.892.06-2.595.546-4.717 1.999-6.156 1.952-1.747 5.467-2.062 7.103-2.073zm.36 2.521a.366.366 0 0 0-.367.366.367.367 0 0 0 .368.367c1.18.013 2.155.404 2.954 1.187.802.785 1.21 1.842 1.225 3.18a.367.367 0 0 0 .733-.008v-.004c-.018-1.514-.494-2.766-1.443-3.696-.948-.93-2.143-1.4-3.467-1.392zm-3.305.81a.95.95 0 0 0-.638.227h-.008c-.43.401-.84.836-1.196 1.28a.86.86 0 0 0-.187.554c.005.224.078.445.187.642.3.572.65 1.116 1.05 1.624.398.519.825 1.014 1.279 1.485.448.484.93.95 1.443 1.398.514.451 1.057.882 1.624 1.295.561.402 1.144.787 1.747 1.144.535.317 1.087.604 1.654.86.043.018.087.038.13.057.087.038.174.083.262.123.115.058.235.108.357.149.27.094.553.09.815-.013l.013-.005c.443-.18.866-.422 1.247-.715.32-.243.609-.526.86-.842.057-.073.114-.15.166-.226.235-.345.213-.78-.083-1.103-.575-.638-1.226-1.176-1.872-1.711a.795.795 0 0 0-1.062.04c-.182.171-.346.36-.493.563l-.083.122c-.165.234-.43.32-.681.226h-.005a8.69 8.69 0 0 1-2.247-1.5c-.633-.59-1.218-1.232-1.745-1.92a4.7 4.7 0 0 1-.522-.91c-.082-.226 0-.495.226-.66l.122-.082c.204-.146.392-.31.563-.493a.795.795 0 0 0 .04-1.061c-.534-.647-1.072-1.298-1.71-1.873a.92.92 0 0 0-.595-.298zM12.262 5.6a.366.366 0 0 0-.013.732c1.43.05 2.612.502 3.521 1.408.91.906 1.36 2.084 1.412 3.51a.366.366 0 0 0 .733-.008c-.058-1.586-.582-2.948-1.624-3.987-1.043-1.039-2.405-1.561-3.992-1.62a.366.366 0 0 0-.037-.035zm.23 1.713a.366.366 0 0 0-.027.731c.738.038 1.262.262 1.626.624.366.363.589.886.628 1.626a.367.367 0 1 0 .732-.04c-.05-.91-.347-1.69-.842-2.18-.495-.49-1.276-.787-2.187-.836z" />
  </svg>
);

export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const options: Array<{
    label: string;
    sublabel: string;
    href: string;
    icon: React.ReactNode;
    color: string;
    external?: boolean;
  }> = [
    {
      label: "Pozovi (RS)",
      sublabel: "+381 69 1982215",
      href: `tel:${PRIMARY_PHONE}`,
      icon: <Phone className="w-4 h-4" />,
      color: "bg-navy text-white",
    },
    {
      label: "Pozovi (HU)",
      sublabel: "+36 20 3115201",
      href: `tel:${SECONDARY_PHONE}`,
      icon: <Phone className="w-4 h-4" />,
      color: "bg-navy text-white",
    },
    {
      label: "WhatsApp",
      sublabel: "Brza poruka",
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
      icon: <WhatsAppIcon className="w-4 h-4" />,
      color: "bg-[#25D366] text-white",
      external: true,
    },
    {
      label: "Viber",
      sublabel: "Brza poruka",
      href: `viber://chat?number=${encodeURIComponent(VIBER_NUMBER)}`,
      icon: <ViberIcon className="w-4 h-4" />,
      color: "bg-[#7360f2] text-white",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end"
    >
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mb-3 w-64 bg-white rounded-2xl shadow-[var(--shadow-elevated)] border border-gray-100 overflow-hidden"
            role="menu"
            aria-label="Brzi kontakt"
          >
            {options.map((opt) => (
              <li key={opt.label}>
                <a
                  href={opt.href}
                  target={opt.external ? "_blank" : undefined}
                  rel={opt.external ? "noopener noreferrer" : undefined}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                  role="menuitem"
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${opt.color}`}
                  >
                    {opt.icon}
                  </span>
                  <span className="flex flex-col text-left">
                    <span className="text-sm font-medium text-navy leading-tight">
                      {opt.label}
                    </span>
                    <span className="text-xs text-gray-500 leading-tight mt-0.5">
                      {opt.sublabel}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? "Zatvori brzi kontakt" : "Otvori brzi kontakt"}
        className="w-12 h-12 bg-teal rounded-full flex items-center justify-center shadow-[var(--shadow-soft)] hover:bg-teal-dark transition-all duration-300 hover:shadow-[var(--shadow-elevated)]"
        style={
          !open
            ? { animation: "subtle-pulse 3s ease-in-out infinite" }
            : undefined
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="phone"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Phone className="w-5 h-5 text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
