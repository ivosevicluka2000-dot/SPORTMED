import { getTranslations } from "next-intl/server";
import DiscountForm from "@/components/admin/DiscountForm";

export const dynamic = "force-dynamic";

export default async function NewDiscountPage() {
  const t = await getTranslations("admin");
  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-navy mb-6">
        {t("discounts.newTitle")}
      </h1>
      <DiscountForm discount={null} />
    </div>
  );
}
