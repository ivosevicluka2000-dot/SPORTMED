"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { clinicPhotos } from "@/lib/clinic-photos";
import PhotoLightbox from "@/components/ui/PhotoLightbox";

type ClinicPhotoGridProps = {
  enableFullscreen?: boolean;
};

export default function ClinicPhotoGrid({
  enableFullscreen = false,
}: ClinicPhotoGridProps) {
  const [activePhoto, setActivePhoto] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[150px] sm:auto-rows-[180px] lg:auto-rows-[210px] gap-3 md:gap-4">
        {clinicPhotos.map((photo, index) => (
          <motion.div
            key={photo.src}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className={`group relative overflow-hidden rounded-lg border border-gray-100 bg-navy/5 shadow-[var(--shadow-soft)] ${
              index === 0 ? "col-span-2 row-span-2" : ""
            }`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes={
                index === 0
                  ? "(max-width: 1024px) 100vw, 50vw"
                  : "(max-width: 1024px) 50vw, 25vw"
              }
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {enableFullscreen && (
              <button
                type="button"
                onClick={() => setActivePhoto(index)}
                className="absolute inset-0 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold"
                aria-label={`Open fullscreen photo ${index + 1}`}
              />
            )}
          </motion.div>
        ))}
      </div>

      {enableFullscreen && activePhoto !== null && (
        <PhotoLightbox
          photos={clinicPhotos}
          initialIndex={activePhoto}
          open
          onClose={() => setActivePhoto(null)}
        />
      )}
    </>
  );
}
