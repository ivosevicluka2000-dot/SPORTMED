import { getTranslations } from "next-intl/server";
import PasswordResetForm from "@/components/account/PasswordResetForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.reset" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function PasswordResetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.reset" });

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="w-8 h-px bg-[var(--color-gold)] mx-auto mb-4" />
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-navy mb-3 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-gray-500">{t("subtitle")}</p>
        </div>
        <PasswordResetForm />
      </div>
    </section>
  );
}
