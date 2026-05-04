import { getTranslations } from "next-intl/server";
import AuthorForm from "@/components/admin/AuthorForm";

export const dynamic = "force-dynamic";

export default async function NewAuthorPage() {
  const t = await getTranslations("admin");
  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-navy mb-6">
        {t("authors.newTitle")}
      </h1>
      <AuthorForm author={null} />
    </div>
  );
}
