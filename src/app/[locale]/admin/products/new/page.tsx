import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data: cats } = await admin
    .from("product_categories")
    .select("id, slug, title")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-navy mb-6">
        {t("products.newTitle")}
      </h1>
      <ProductForm
        product={null}
        categories={(cats ?? []) as { id: string; slug: string; title: Record<string, string> | null }[]}
      />
    </div>
  );
}
