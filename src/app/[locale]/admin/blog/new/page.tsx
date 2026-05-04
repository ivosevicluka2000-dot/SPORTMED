import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import BlogPostForm from "@/components/admin/BlogPostForm";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage({
  searchParams,
}: {
  searchParams: Promise<{ translation_group?: string }>;
}) {
  const sp = await searchParams;
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const [{ data: authors }, { data: cats }, { data: others }] = await Promise.all([
    admin.from("blog_authors").select("id, name").order("name"),
    admin
      .from("blog_categories")
      .select("id, slug, title, language")
      .order("title"),
    admin
      .from("blog_posts")
      .select("id, title, language")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // Convert blog_categories rows (one per language) into the title-as-record shape
  // expected by BlogPostForm. Group by id is N/A here — categories are per-language
  // rows; just present them with the language tag in the label.
  type Cat = { id: string; slug: string; title: string; language: "sr" | "en" };
  const categoryOptions = ((cats as Cat[]) ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: { [c.language]: `[${c.language.toUpperCase()}] ${c.title}` },
  }));

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold text-navy mb-6">
        {t("blog.newTitle")}
      </h1>
      <BlogPostForm
        post={null}
        authors={(authors ?? []) as { id: string; name: string }[]}
        categories={categoryOptions}
        otherPosts={(others ?? []) as { id: string; title: string; language: "sr" | "en" }[]}
        initialTranslationGroup={sp.translation_group}
      />
    </div>
  );
}
