"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import Section from "@/components/ui/Section";
import { ArrowRight } from "lucide-react";

type Tile = {
  key: "premiumProduct" | "b2bSolutions" | "education" | "clinicRehab";
  href: React.ComponentProps<typeof Link>["href"];
  image: string;
};

const tiles: Tile[] = [
  {
    key: "premiumProduct",
    href: "/prodavnica",
    image:
      "https://images.pexels.com/photos/4397833/pexels-photo-4397833.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    key: "b2bSolutions",
    href: "/b2b",
    image:
      "https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    key: "education",
    href: "/blog",
    image:
      "https://images.pexels.com/photos/3838389/pexels-photo-3838389.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    key: "clinicRehab",
    href: "/usluge",
    image:
      "https://images.pexels.com/photos/4506109/pexels-photo-4506109.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

export default function HomeTiles() {
  const t = useTranslations("homeTiles");

  return (
    <Section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {tiles.map((tile, index) => (
          <motion.div
            key={tile.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.32) }}
          >
            <Link href={tile.href} className="block group">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-navy">
                <Image
                  src={tile.image}
                  alt={t(`items.${tile.key}.title`)}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-navy/10" />
                <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end text-white">
                  <h3 className="font-heading text-lg md:text-xl font-semibold leading-tight mb-1.5">
                    {t(`items.${tile.key}.title`)}
                  </h3>
                  <p className="text-sm text-white/80 leading-snug mb-3 line-clamp-2">
                    {t(`items.${tile.key}.subtitle`)}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-teal group-hover:gap-2.5 transition-all">
                    {t("learnMore")}
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
