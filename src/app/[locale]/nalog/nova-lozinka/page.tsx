import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import NewPasswordForm from "@/components/account/NewPasswordForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.newPassword" });
  return {
    title: t("title"),
    referrer: "no-referrer",
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function NewPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.newPassword" });
  return (
    <section className="flex min-h-[80vh] items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-3 text-xs font-semibold tracking-widest text-teal">SPORT CARE &amp; MED</p>
        <h1 className="mb-6 font-heading text-3xl font-semibold text-navy">{t("title")}</h1>
        <NewPasswordForm />
      </div>
    </section>
  );
}
