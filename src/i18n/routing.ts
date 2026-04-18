import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["sr", "en"],
  defaultLocale: "sr",
  pathnames: {
    "/": "/",
    "/usluge": {
      sr: "/usluge",
      en: "/services",
    },
    "/usluge/[slug]": {
      sr: "/usluge/[slug]",
      en: "/services/[slug]",
    },
    "/o-nama": {
      sr: "/o-nama",
      en: "/about",
    },
    "/lokacija": {
      sr: "/lokacija",
      en: "/location",
    },
    "/kontakt": {
      sr: "/kontakt",
      en: "/contact",
    },
    "/b2b": "/b2b",
    "/b2b/[slug]": "/b2b/[slug]",
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/prodavnica": {
      sr: "/prodavnica",
      en: "/shop",
    },
    "/prodavnica/[slug]": {
      sr: "/prodavnica/[slug]",
      en: "/shop/[slug]",
    },
    "/prodavnica/korpa": {
      sr: "/prodavnica/korpa",
      en: "/shop/cart",
    },
    "/prodavnica/checkout": {
      sr: "/prodavnica/checkout",
      en: "/shop/checkout",
    },
    "/prodavnica/potvrda": {
      sr: "/prodavnica/potvrda",
      en: "/shop/confirmation",
    },
    "/alati": {
      sr: "/alati",
      en: "/tools",
    },
    "/alati/procena-oporavka": {
      sr: "/alati/procena-oporavka",
      en: "/tools/recovery-estimate",
    },
    "/alati/spremnost-za-sport": {
      sr: "/alati/spremnost-za-sport",
      en: "/tools/sport-readiness",
    },
  },
});

export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
