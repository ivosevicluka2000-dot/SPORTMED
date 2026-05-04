import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import CategoryForm from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("product_categories")
    .select("id, slug, title, description, image_url, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-navy mb-6">
        {t("categories.editTitle")}
      </h1>
      <CategoryForm category={data as Parameters<typeof CategoryForm>[0]["category"]} />
    </div>
  );
}
