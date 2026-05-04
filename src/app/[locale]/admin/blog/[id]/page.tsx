import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import BlogPostForm from "@/components/admin/BlogPostForm";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("admin");
  const admin = createAdminClient();
  const { data: post } = await admin
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();
  const [{ data: authors }, { data: cats }, { data: others }] = await Promise.all([
    admin.from("blog_authors").select("id, name").order("name"),
    admin
      .from("blog_categories")
      .select("id, slug, title, language")
      .order("title"),
    admin
      .from("blog_posts")
      .select("id, title, language")
      .neq("id", id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  type Cat = { id: string; slug: string; title: string; language: "sr" | "en" };
  const categoryOptions = ((cats as Cat[]) ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: { [c.language]: `[${c.language.toUpperCase()}] ${c.title}` },
  }));

  const otherLang = post.language === "sr" ? "en" : "sr";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-semibold text-navy">
          {t("blog.editTitle")}
        </h1>
        <Link
          href={{
            pathname: "/admin/blog/new",
            query: { translation_group: post.translation_group },
          }}
          className="text-sm text-teal hover:underline"
        >
          + {t("blog.translationGroup")} ({otherLang.toUpperCase()})
        </Link>
      </div>
      <BlogPostForm
        post={post as Parameters<typeof BlogPostForm>[0]["post"]}
        authors={(authors ?? []) as { id: string; name: string }[]}
        categories={categoryOptions}
        otherPosts={(others ?? []) as { id: string; title: string; language: "sr" | "en" }[]}
      />
    </div>
  );
}
