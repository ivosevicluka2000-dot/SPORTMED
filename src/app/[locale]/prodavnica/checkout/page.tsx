import { getTranslations } from "next-intl/server";
import CheckoutForm from "@/components/shop/CheckoutForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return {
    title: t("checkoutTitle"),
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="w-8 h-px bg-[var(--color-gold)] mb-4" />
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-navy tracking-tight">
            {t("checkoutTitle")}
          </h1>
        </div>
        <CheckoutForm />
      </div>
    </section>
  );
}
