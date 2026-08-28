import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
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
            Nalog nema pristup
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Prijavljeni nalog nije dodat u Rehab tim.
          </p>
          <form action={rehabSignOutAction} className="mt-6">
            <input type="hidden" name="locale" value={locale} />
            <button className="rounded-md border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Odjavi se i pokušaj drugim nalogom
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 px-4 py-20 md:py-28">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-dark">
            <Activity className="h-6 w-6" />
          </span>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-dark">
            Sport Care &amp; Med
          </p>
          <h1 className="font-heading text-3xl font-semibold text-navy">
            Rehab platforma
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Prijava za fizioterapeute i saradnike
          </p>
        </div>
        <RehabLoginForm next={next} />
      </div>
    </section>
  );
}
