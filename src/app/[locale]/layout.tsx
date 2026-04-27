import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { routing } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingContact from "@/components/layout/FloatingContact";
import PageTransition from "@/components/layout/PageTransition";
import Popups from "@/components/layout/Popups";
import CartToast from "@/components/shop/CartToast";
import { CartProvider } from "@/lib/cart-context";
import { DiscountProvider } from "@/lib/discount-context";

const SITE_URL = "https://sportcaremed.rs";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: "Sport Care Med",
  description:
    "Centar za sportsku medicinu, fizikalnu terapiju i rehabilitaciju u Šapcu.",
  url: "https://sportcaremed.rs",
  telephone: "+381600000000",
  email: "info@sportcaremed.rs",
  logo: "https://sportcaremed.rs/logo.png",
  image: "https://sportcaremed.rs/opengraph-image.png",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Šabac",
    addressCountry: "RS",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "14:00",
    },
  ],
  medicalSpecialty: "Sports Medicine",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const ogLocale = locale === "sr" ? "sr_RS" : "en_US";
  const url = locale === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${locale}`;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: url,
      languages: {
        sr: SITE_URL,
        en: `${SITE_URL}/en`,
        "x-default": SITE_URL,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Sport Care Med",
      title: t("title"),
      description: t("description"),
      url,
      locale: ogLocale,
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "Sport Care Med",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/twitter-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html lang={locale} className={`h-full ${inter.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-white text-gray-800">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            <Suspense>
              <DiscountProvider>
                <a
                  href="#main-content"
                  className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-navy focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:outline-2 focus:outline-teal"
                >
                  {messages.a11y?.skipToContent ?? "Skip to content"}
                </a>
                <Header />
                <main id="main-content" className="flex-1">
                  <PageTransition>{children}</PageTransition>
                </main>
                <Footer />
                <FloatingContact />
                <Popups />
                <CartToast />
              </DiscountProvider>
            </Suspense>
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
