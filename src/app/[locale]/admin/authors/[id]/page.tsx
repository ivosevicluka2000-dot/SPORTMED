import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import AuthorForm from "@/components/admin/AuthorForm";

export const dynamic = "force-dynamic";

export default async function EditAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_authors")
    .select("id, name, role, image_url, bio")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-navy mb-6">
        {t("authors.editTitle")}
      </h1>
      <AuthorForm author={data as Parameters<typeof AuthorForm>[0]["author"]} />
    </div>
  );
}
