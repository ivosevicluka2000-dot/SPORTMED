import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getCounts() {
  const admin = createAdminClient();
  const [products, orders, posts, leads] = await Promise.all([
    admin.from("products").select("*", { count: "exact", head: true }),
    admin.from("orders").select("*", { count: "exact", head: true }),
    admin.from("blog_posts").select("*", { count: "exact", head: true }),
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
  ]);
  return {
    products: products.count ?? 0,
    orders: orders.count ?? 0,
    posts: posts.count ?? 0,
    leads: leads.count ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const counts = await getCounts();

  const cards = [
    { label: t("products"), value: counts.products },
    { label: t("orders"), value: counts.orders },
    { label: t("posts"), value: counts.posts },
    { label: t("leads"), value: counts.leads },
  ];

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-navy mb-2">
        {t("title")}
      </h1>
      <p className="text-gray-600 mb-8">
        {t("hello", { name: profile?.full_name ?? user?.email ?? "" })}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div className="text-3xl font-semibold text-navy">{c.value}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
