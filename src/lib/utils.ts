import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const treatments = [
  {
    slug: "fizikalna-terapija",
    icon: "Zap",
    relatedSlugs: ["manuelna-terapija", "kineziterapija"],
  },
  {
    slug: "manuelna-terapija",
    icon: "Hand",
    relatedSlugs: ["fizikalna-terapija", "masaza"],
  },
  {
    slug: "kineziterapija",
    icon: "Dumbbell",
    relatedSlugs: ["sportska-rehabilitacija", "fizikalna-terapija"],
  },
  {
    slug: "dijagnostika",
    icon: "Stethoscope",
    relatedSlugs: ["testiranje-merenja", "sportska-rehabilitacija"],
  },
  {
    slug: "sportska-rehabilitacija",
    icon: "HeartPulse",
    relatedSlugs: ["kineziterapija", "fizikalna-terapija"],
  },
  {
    slug: "masaza",
    icon: "Sparkles",
    relatedSlugs: ["recovery-terapije", "manuelna-terapija"],
  },
  {
    slug: "recovery-terapije",
    icon: "Snowflake",
    relatedSlugs: ["masaza", "sportska-rehabilitacija"],
  },
  {
    slug: "testiranje-merenja",
    icon: "BarChart3",
    relatedSlugs: ["dijagnostika", "sportska-rehabilitacija"],
  },
] as const;

export type TreatmentSlug = (typeof treatments)[number]["slug"];

export const b2bServices = [
  {
    slug: "timska-rehabilitacija",
    icon: "HeartPulse",
    relatedSlugs: ["fizioterapija-na-terenu", "prevencija-povreda"],
  },
  {
    slug: "fizioterapija-na-terenu",
    icon: "MapPinned",
    relatedSlugs: ["timska-rehabilitacija", "prevencija-povreda"],
  },
  {
    slug: "prevencija-povreda",
    icon: "ShieldCheck",
    relatedSlugs: ["testiranje-performansi", "timska-rehabilitacija"],
  },
  {
    slug: "testiranje-performansi",
    icon: "BarChart3",
    relatedSlugs: ["prevencija-povreda", "fizioterapija-na-terenu"],
  },
] as const;

export type B2BServiceSlug = (typeof b2bServices)[number]["slug"];
