"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import Section from "@/components/ui/Section";
import { ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Tile = {
  key: "premiumProduct" | "b2bSolutions" | "education" | "clinicRehab";
  href: React.ComponentProps<typeof Link>["href"];
  image: string;
  featured?: boolean;
};

const tiles: Tile[] = [
  {
    key: "premiumProduct",
    href: "/prodavnica",
    image:
      "https://images.pexels.com/photos/4397833/pexels-photo-4397833.jpeg?auto=compress&cs=tinysrgb&w=1200",
    featured: true,
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
    featured: true,
  },
];

export default function HomeTiles() {
  const t = useTranslations("homeTiles");

  return (
    <Section>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {tiles.map((tile, index) => (
          <motion.div
            key={tile.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.32) }}
          >
            <Link href={tile.href} className="block group">
              <div
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-xl bg-navy transition-all duration-300",
                  tile.featured &&
                    "ring-2 ring-gold/70 shadow-[0_10px_40px_-10px_rgba(212,175,55,0.45)] hover:shadow-[0_18px_60px_-10px_rgba(212,175,55,0.6)]"
                )}
              >
                <Image
                  src={tile.image}
                  alt={t(`items.${tile.key}.title`)}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/30 to-navy/70" />
                {tile.featured && (
                  <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-gold/95 text-navy text-[10px] font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full shadow-sm">
                    <Star className="w-3 h-3 fill-navy" />
                    {t("featured")}
                  </span>
                )}
                <div className="absolute inset-0 p-6 md:p-10 flex flex-col items-center text-center text-white">
                  <h3 className="font-heading text-2xl md:text-3xl lg:text-4xl font-semibold tracking-wide uppercase leading-tight mt-6 md:mt-10">
                    {t(`items.${tile.key}.title`)}
                  </h3>
                  <p className="text-xs md:text-sm text-white/85 leading-snug uppercase tracking-[0.15em] mt-3 max-w-md">
                    {t(`items.${tile.key}.subtitle`)}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-teal group-hover:gap-2.5 transition-all">
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
