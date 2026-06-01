"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type PhotoLightboxItem = {
  src: string;
  alt: string;
  label?: string;
};

type PhotoLightboxProps = {
  photos: readonly PhotoLightboxItem[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
};

function clampPhotoIndex(index: number, total: number) {
  return Math.min(Math.max(index, 0), Math.max(total - 1, 0));
}

export default function PhotoLightbox({
  photos,
  initialIndex,
  open,
  onClose,
}: PhotoLightboxProps) {
  const [current, setCurrent] = useState(() =>
    clampPhotoIndex(initialIndex, photos.length)
  );
  const touchStartX = useRef<number | null>(null);

  const totalPhotos = photos.length;
  const activePhoto = photos[current];

  const showPrevious = useCallback(() => {
    setCurrent((index) => (index === 0 ? totalPhotos - 1 : index - 1));
  }, [totalPhotos]);

  const showNext = useCallback(() => {
    setCurrent((index) => (index === totalPhotos - 1 ? 0 : index + 1));
  }, [totalPhotos]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && totalPhotos > 1) {
        showPrevious();
      } else if (event.key === "ArrowRight" && totalPhotos > 1) {
        showNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, showNext, showPrevious, totalPhotos]);

  if (!open || !activePhoto) return null;

  const handleTouchEnd = (x: number) => {
    if (touchStartX.current === null || totalPhotos < 2) return;

    const delta = x - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < 48) return;
    if (delta > 0) {
      showPrevious();
    } else {
      showNext();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Fullscreen photo gallery"
        className="fixed inset-0 z-[80] flex flex-col bg-navy/95 text-white backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            {activePhoto.label && (
              <p className="truncate text-sm font-medium text-white">
                {activePhoto.label}
              </p>
            )}
            <p className="text-xs text-white/60">
              {current + 1} / {totalPhotos}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-gold"
            aria-label="Close fullscreen gallery"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div
          className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-6"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            handleTouchEnd(event.changedTouches[0]?.clientX ?? 0);
          }}
        >
          <motion.div
            key={activePhoto.src}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative h-full w-full"
          >
            <Image
              src={activePhoto.src}
              alt={activePhoto.alt}
              fill
              sizes="100vw"
              priority
              className="object-contain"
            />
          </motion.div>

          {totalPhotos > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-gold sm:left-6 sm:h-12 sm:w-12"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-gold sm:right-6 sm:h-12 sm:w-12"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {totalPhotos > 1 && (
          <div className="overflow-x-auto px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="flex min-w-max gap-2">
              {photos.map((photo, index) => (
                <button
                  key={`${photo.src}-${index}`}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={`Show photo ${index + 1}`}
                  aria-current={index === current ? "true" : undefined}
                  className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-md border transition focus:outline-none focus:ring-2 focus:ring-gold sm:h-20 sm:w-28 ${
                    index === current
                      ? "border-gold"
                      : "border-white/20 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={photo.src}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
