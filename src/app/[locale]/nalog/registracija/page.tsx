import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getPathname, type Locale } from "@/i18n/routing";
import SignupForm from "@/components/account/SignupForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account.signup" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    redirect(getPathname({ locale: locale as Locale, href: "/nalog" }));
  }
  const t = await getTranslations({ locale, namespace: "account.signup" });

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
        <SignupForm />
      </div>
    </section>
  );
}
