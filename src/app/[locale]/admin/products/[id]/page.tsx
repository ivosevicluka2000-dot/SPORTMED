import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("admin");
  const admin = createAdminClient();

  const [{ data: product }, { data: cats }] = await Promise.all([
    admin
      .from("products")
      .select(
        "id, slug, name, description, images, price, compare_at_price, category_id, stock, featured, active, product_type"
      )
      .eq("id", id)
      .maybeSingle(),
    admin
      .from("product_categories")
      .select("id, slug, title")
      .order("sort_order", { ascending: true }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-navy mb-6">
        {t("products.editTitle")}
      </h1>
      <ProductForm
        product={product as Parameters<typeof ProductForm>[0]["product"]}
        categories={(cats ?? []) as { id: string; slug: string; title: Record<string, string> | null }[]}
      />
    </div>
  );
}
