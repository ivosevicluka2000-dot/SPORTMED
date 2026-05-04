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
    "/privatnost": {
      sr: "/privatnost",
      en: "/privacy",
    },
    "/uslovi": {
      sr: "/uslovi",
      en: "/terms",
    },
    "/nalog": {
      sr: "/nalog",
      en: "/account",
    },
    "/nalog/prijava": {
      sr: "/nalog/prijava",
      en: "/account/login",
    },
    "/nalog/registracija": {
      sr: "/nalog/registracija",
      en: "/account/signup",
    },
    "/nalog/oporavak-lozinke": {
      sr: "/nalog/oporavak-lozinke",
      en: "/account/password-reset",
    },
    "/nalog/porudzbine/[orderNumber]": {
      sr: "/nalog/porudzbine/[orderNumber]",
      en: "/account/orders/[orderNumber]",
    },
    "/admin": "/admin",
    "/admin/products": "/admin/products",
    "/admin/products/new": "/admin/products/new",
    "/admin/products/[id]": "/admin/products/[id]",
    "/admin/categories": "/admin/categories",
    "/admin/categories/new": "/admin/categories/new",
    "/admin/categories/[id]": "/admin/categories/[id]",
    "/admin/discounts": "/admin/discounts",
    "/admin/discounts/new": "/admin/discounts/new",
    "/admin/discounts/[id]": "/admin/discounts/[id]",
    "/admin/orders": "/admin/orders",
    "/admin/orders/[id]": "/admin/orders/[id]",
    "/admin/blog": "/admin/blog",
    "/admin/blog/new": "/admin/blog/new",
    "/admin/blog/[id]": "/admin/blog/[id]",
    "/admin/authors": "/admin/authors",
    "/admin/authors/new": "/admin/authors/new",
    "/admin/authors/[id]": "/admin/authors/[id]",
    "/admin/leads": "/admin/leads",
    "/admin/newsletter": "/admin/newsletter",
  },
});

export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
