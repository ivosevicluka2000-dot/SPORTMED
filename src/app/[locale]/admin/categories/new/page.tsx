import { getTranslations } from "next-intl/server";
import CategoryForm from "@/components/admin/CategoryForm";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const t = await getTranslations("admin");
  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-navy mb-6">
        {t("categories.newTitle")}
      </h1>
      <CategoryForm category={null} />
    </div>
  );
}
