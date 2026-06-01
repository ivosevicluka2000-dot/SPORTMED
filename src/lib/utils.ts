import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const treatments = [
  // ── Rehab ────────────────────────────────────────────────────────────
  {
    slug: "fizikalna-terapija",
    icon: "Zap",
    categories: ["rehab"],
    relatedSlugs: ["manuelna-terapija", "kineziterapija"],
  },
  {
    slug: "manuelna-terapija",
    icon: "Hand",
    categories: ["rehab"],
    relatedSlugs: ["fizikalna-terapija", "masaza"],
  },
  {
    slug: "kineziterapija",
    icon: "Dumbbell",
    categories: ["rehab"],
    relatedSlugs: ["sportska-rehabilitacija", "fizikalna-terapija"],
  },
  {
    slug: "cupping-terapija",
    icon: "Circle",
    categories: ["rehab"],
    relatedSlugs: ["masaza", "manuelna-terapija"],
  },
  {
    slug: "flossing-terapija",
    icon: "Link2",
    categories: ["rehab"],
    relatedSlugs: ["manuelna-terapija", "kineziterapija"],
  },
  {
    slug: "kinesiotape",
    icon: "Tag",
    categories: ["rehab"],
    relatedSlugs: ["sportska-rehabilitacija", "fizikalna-terapija"],
  },
  {
    slug: "sportska-rehabilitacija",
    icon: "HeartPulse",
    categories: ["rehab"],
    relatedSlugs: ["kineziterapija", "fizikalna-terapija"],
  },
  {
    slug: "dijagnostika",
    icon: "Stethoscope",
    categories: ["rehab"],
    relatedSlugs: ["testiranje-merenja", "sportska-rehabilitacija"],
  },
  // ── Both (shared) ────────────────────────────────────────────────────
  {
    slug: "masaza",
    icon: "Sparkles",
    categories: ["rehab", "recovery"],
    relatedSlugs: ["recovery-terapije", "manuelna-terapija"],
  },
  // ── Recovery ─────────────────────────────────────────────────────────
  {
    slug: "recovery-terapije",
    icon: "Snowflake",
    categories: ["recovery"],
    relatedSlugs: ["masaza", "sportska-rehabilitacija"],
  },
  {
    slug: "presoterapija",
    icon: "Wind",
    categories: ["recovery"],
    relatedSlugs: ["recovery-terapije", "masaza"],
  },
  {
    slug: "tretman-masaznim-pistoljem",
    icon: "Vibrate",
    categories: ["recovery"],
    relatedSlugs: ["masaza", "recovery-terapije"],
  },
  {
    slug: "testiranje-merenja",
    icon: "BarChart3",
    categories: ["recovery"],
    relatedSlugs: ["dijagnostika", "sportska-rehabilitacija"],
  },
] as const;

export type TreatmentSlug = (typeof treatments)[number]["slug"];
export type TreatmentCategory = "rehab" | "recovery";

export const rehabTreatments = treatments.filter((t) =>
  (t.categories as readonly string[]).includes("rehab")
);
export const recoveryTreatments = treatments.filter((t) =>
  (t.categories as readonly string[]).includes("recovery")
);

// Homepage and related-card imagery, one per treatment slug.
export const treatmentImages: Record<TreatmentSlug, string> = {
  "fizikalna-terapija": "/treatments/fizikalna-terapija.jpeg",
  "manuelna-terapija": "/treatments/manuelna-terapija.jpeg",
  "kineziterapija": "/treatments/kineziterapija.jpeg",
  "cupping-terapija": "/treatments/cupping-terapija.jpeg",
  "flossing-terapija": "/treatments/flossing-terapija.jpeg",
  "kinesiotape": "/treatments/kinesiotape.jpeg",
  "sportska-rehabilitacija":
    "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "dijagnostika":
    "https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "masaza": "/treatments/masaza.jpeg",
  "recovery-terapije": "/treatments/recovery-terapije.jpeg",
  "presoterapija": "/treatments/presoterapija.jpeg",
  "tretman-masaznim-pistoljem": "/treatments/tretman-masaznim-pistoljem.jpeg",
  "testiranje-merenja": "/treatments/testiranje-merenja.jpeg",
};

export const treatmentHeroImages: Partial<Record<TreatmentSlug, string>> = {
  "fizikalna-terapija": "/treatments/fizikalna-terapija.jpeg",
  "manuelna-terapija": "/treatments/manuelna-terapija.jpeg",
  "kineziterapija": "/treatments/kineziterapija.jpeg",
  "cupping-terapija": "/treatments/cupping-terapija.jpeg",
  "flossing-terapija": "/treatments/flossing-terapija.jpeg",
  "kinesiotape": "/treatments/kinesiotape.jpeg",
  "sportska-rehabilitacija": treatmentImages["sportska-rehabilitacija"],
  "dijagnostika": treatmentImages.dijagnostika,
  "masaza": "/treatments/masaza.jpeg",
  "recovery-terapije": "/treatments/recovery-terapije.jpeg",
  "presoterapija": "/treatments/presoterapija.jpeg",
  "tretman-masaznim-pistoljem": "/treatments/tretman-masaznim-pistoljem.jpeg",
  "testiranje-merenja": "/treatments/testiranje-merenja.jpeg",
};

export const b2bProductKits = [
  {
    slug: "klupski-recovery-kit",
    icon: "Package",
    kind: "kit",
    relatedSlugs: ["taping-bandaging-paket", "suplementi-paket"],
  },
  {
    slug: "taping-bandaging-paket",
    icon: "Tag",
    kind: "kit",
    relatedSlugs: ["prva-pomoc-paket", "klupski-recovery-kit"],
  },
  {
    slug: "prva-pomoc-paket",
    icon: "Cross",
    kind: "kit",
    relatedSlugs: ["taping-bandaging-paket", "oprema-za-zagrevanje"],
  },
  {
    slug: "suplementi-paket",
    icon: "Pill",
    kind: "kit",
    relatedSlugs: ["klupski-recovery-kit", "oprema-za-zagrevanje"],
  },
  {
    slug: "oprema-za-zagrevanje",
    icon: "Dumbbell",
    kind: "kit",
    relatedSlugs: ["klupski-recovery-kit", "taping-bandaging-paket"],
  },
] as const;

export const b2bServices = [
  {
    slug: "timska-rehabilitacija",
    icon: "HeartPulse",
    kind: "service",
    relatedSlugs: ["fizioterapija-na-terenu", "prevencija-povreda"],
  },
  {
    slug: "fizioterapija-na-terenu",
    icon: "MapPinned",
    kind: "service",
    relatedSlugs: ["timska-rehabilitacija", "prevencija-povreda"],
  },
  {
    slug: "prevencija-povreda",
    icon: "ShieldCheck",
    kind: "service",
    relatedSlugs: ["testiranje-performansi", "timska-rehabilitacija"],
  },
  {
    slug: "testiranje-performansi",
    icon: "BarChart3",
    kind: "service",
    relatedSlugs: ["prevencija-povreda", "fizioterapija-na-terenu"],
  },
] as const;

export type B2BServiceSlug = (typeof b2bServices)[number]["slug"];
export type B2BKitSlug = (typeof b2bProductKits)[number]["slug"];
export type B2BItemSlug = B2BServiceSlug | B2BKitSlug;
export type B2BItemKind = "service" | "kit";

export const b2bAllItems = [...b2bProductKits, ...b2bServices] as const;
