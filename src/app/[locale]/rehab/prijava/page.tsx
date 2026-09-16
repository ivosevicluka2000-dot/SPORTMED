import { RehabLanguageSwitcher } from "@/components/rehab/RehabLanguageSwitcher";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { CLINIC_REPORT_LOGO } from "@/lib/rehab/branding";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/routing";
import RehabLoginForm from "@/components/rehab/RehabLoginForm";
import { rehabSignOutAction } from "@/lib/rehab/auth-actions";
import { safeRehabNext } from "@/lib/rehab/redirects";

export const dynamic = "force-dynamic";

export default async function RehabLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const t = await getTranslations("rehab");
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams]);
  const locale = rawLocale as Locale;
  const next = safeRehabNext(locale, query.next);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("rehab_workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle(),
    ]);

    if (profile?.role === "admin" || membership) {
      redirect(next);
    }

    return (
      <section className="bg-gray-50 px-4 py-20 md:py-28">
        <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-sm">
          <h1 className="font-heading text-2xl font-semibold text-navy">
             {t("labelAccountHasNoAccess")} </h1>
          <p className="mt-3 text-sm text-gray-600">
             {t("labelTheSignedInAccountHasNotBeen")} </p>
          <form action={rehabSignOutAction} className="mt-6">
            <input type="hidden" name="locale" value={locale} />
            <button className="rounded-md border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
               {t("labelSignOutAndTryAnotherAccount")} </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-svh items-center justify-center bg-[radial-gradient(ellipse_at_top,#e5edef_0%,#f5f7f8_55%,#f8fafc_100%)] px-5 py-8 sm:py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-4 flex justify-end">
          <RehabLanguageSwitcher compact />
        </div>
        <div className="overflow-hidden rounded-3xl border border-white bg-white shadow-[0_20px_70px_-25px_rgba(45,65,73,0.25),0_2px_8px_rgba(45,65,73,0.04)]">
          <div className="flex justify-center bg-[#4d636a] px-8 py-5 sm:py-6">
            <Image src={CLINIC_REPORT_LOGO} alt="Sport Care Med" width={682} height={416}
              unoptimized loading="eager" className="h-auto w-48 sm:w-52" />
          </div>
          <div className="px-6 pb-8 pt-7 sm:px-9 sm:pb-9 sm:pt-8">
            <div className="mb-7">
              <h1 className="font-sans text-[26px] font-semibold tracking-tight text-navy-dark sm:text-[28px]">
                {t("labelSportCareMed")}
              </h1>
              <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-gray-500">
                {t("labelSignInForPhysiotherapistsAndCollaborators")}
              </p>
            </div>
            <RehabLoginForm next={next} />
          </div>
        </div>
      </div>
    </section>
  );
}
