import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import DiscountForm from "@/components/admin/DiscountForm";

export const dynamic = "force-dynamic";

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("discount_codes")
    .select(
      "id, code, type, value, valid_from, valid_until, max_uses, used_count, min_order_amount, active"
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-navy mb-6">
        {t("discounts.editTitle")}
      </h1>
      <DiscountForm
        discount={data as Parameters<typeof DiscountForm>[0]["discount"]}
      />
    </div>
  );
}
