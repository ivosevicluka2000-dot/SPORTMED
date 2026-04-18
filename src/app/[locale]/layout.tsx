import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { routing } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingContact from "@/components/layout/FloatingContact";
import PageTransition from "@/components/layout/PageTransition";
import LeadCapturePopup from "@/components/sections/LeadCapturePopup";
import ExitIntentPopup from "@/components/sections/ExitIntentPopup";
import { CartProvider } from "@/lib/cart-context";
import { DiscountProvider } from "@/lib/discount-context";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: "Sport Care Med",
  description:
    "Centar za sportsku medicinu, fizikalnu terapiju i rehabilitaciju u Šapcu.",
  url: "https://sportcaremed.rs",
  telephone: "+381600000000",
  email: "info@sportcaremed.rs",
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

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html lang={locale} className="h-full">
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
                <Header />
                <main className="flex-1">
                  <PageTransition>{children}</PageTransition>
                </main>
                <Footer />
                <FloatingContact />
                <LeadCapturePopup />
                <ExitIntentPopup />
              </DiscountProvider>
            </Suspense>
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
