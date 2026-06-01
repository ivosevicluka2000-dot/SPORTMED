"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { clinicPhotos } from "@/lib/clinic-photos";

export default function ClinicPhotoGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[150px] sm:auto-rows-[180px] lg:auto-rows-[210px] gap-3 md:gap-4">
      {clinicPhotos.map((photo, index) => (
        <motion.div
          key={photo.src}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
          className={`relative overflow-hidden rounded-lg border border-gray-100 bg-navy/5 shadow-[var(--shadow-soft)] ${
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
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </motion.div>
      ))}
    </div>
  );
}
