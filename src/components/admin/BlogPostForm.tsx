"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteForm from "@/components/admin/DeleteForm";
import PortableTextRenderer from "@/components/blog/PortableTextRenderer";
import {
  upsertBlogPostAction,
  deleteBlogPostAction,
} from "@/app/[locale]/admin/blog/_actions";

interface BlogPostFormProps {
  post?: {
    id: string;
    translation_group: string;
    slug: string;
    language: "sr" | "en";
    title: string;
    excerpt: string;
    body_markdown: string;
    main_image_url: string | null;
    images: string[] | null;
    author_id: string | null;
    category_ids: string[];
    related_post_ids: string[];
    reading_time: number;
    published_at: string | null;
  } | null;
  authors: { id: string; name: string }[];
  categories: { id: string; title: Record<string, string> | null; slug: string }[];
  /** Other posts available for related selection (already in same language). */
  otherPosts: { id: string; title: string; language: "sr" | "en" }[];
  /** Optional translation_group seed when adding a translation of an existing post. */
  initialTranslationGroup?: string;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function nowLocalInput(): string {
  return toLocalInput(new Date().toISOString());
}

export default function BlogPostForm({
  post,
  authors,
  categories,
  otherPosts,
  initialTranslationGroup,
}: BlogPostFormProps) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [body, setBody] = useState(post?.body_markdown ?? "");
  const [showPreview, setShowPreview] = useState(false);
  const initialStatus: \"draft\" | \"now\" | \"schedule\" = (() => {
    if (!post) return \"now\";
    if (!post.published_at) return \"draft\";
    return new Date(post.published_at).getTime() > Date.now() ? \"schedule\" : \"now\";
  })();
  const [status, setStatus] = useState<\"draft\" | \"now\" | \"schedule\">(initialStatus);
  const [scheduledAt, setScheduledAt] = useState<string>(() => {
    if (post?.published_at && new Date(post.published_at).getTime() > Date.now()) {
      return toLocalInput(post.published_at);
    }
    return nowLocalInput();
  });  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-200 focus:border-teal focus:outline-none text-sm";

  return (
    <div className="space-y-6">
      <form
        action={upsertBlogPostAction}
        className="space-y-5 bg-white border border-gray-200 rounded-xl p-6"
      >
        {post?.id && <input type="hidden" name="id" value={post.id} />}
        {!post && initialTranslationGroup && (
          <input
            type="hidden"
            name="translation_group"
            value={initialTranslationGroup}
          />
        )}
        <input type="hidden" name="locale" value={locale} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("blog.language")}
            </label>
            <select
              name="language"
              defaultValue={post?.language ?? "sr"}
              className={inputClass}
              required
              disabled={!!post}
            >
              <option value="sr">SR</option>
              <option value="en">EN</option>
            </select>
            {post && (
              <input type="hidden" name="language" value={post.language} />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("blog.slug")}
            </label>
            <input
              type="text"
              name="slug"
              defaultValue={post?.slug ?? ""}
              required
              pattern="[a-z0-9\\-]+"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("blog.postTitle")}
          </label>
          <input
            type="text"
            name="title"
            defaultValue={post?.title ?? ""}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("blog.excerpt")}
          </label>
          <textarea
            name="excerpt"
            defaultValue={post?.excerpt ?? ""}
            required
            rows={2}
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-navy">
              {t("blog.body")}
            </label>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="text-xs text-teal hover:underline"
            >
              {showPreview ? t("blog.body") : t("blog.preview")}
            </button>
          </div>
          {showPreview ? (
            <div className="border border-gray-200 rounded-md p-4 prose prose-sm max-w-none min-h-[300px]">
              <PortableTextRenderer value={body} />
            </div>
          ) : (
            <textarea
              name="body_markdown"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              className={`${inputClass} font-mono`}
            />
          )}
          {showPreview && (
            <input type="hidden" name="body_markdown" value={body} />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("blog.coverImage")}
          </label>
          <ImageUploader
            name="main_image_url"
            bucket="blog-images"
            multiple={false}
            initial={post?.main_image_url ? [post.main_image_url] : []}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("blog.galleryImages")}
          </label>
          <ImageUploader
            name="images"
            bucket="blog-images"
            multiple
            initial={post?.images ?? []}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("blog.author")}
            </label>
            <select
              name="author_id"
              defaultValue={post?.author_id ?? ""}
              className={inputClass}
            >
              <option value="">—</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">
              {t("blog.readingTime")}
            </label>
            <input
              type="number"
              name="reading_time"
              min={1}
              step={1}
              defaultValue={post?.reading_time ?? 5}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("blog.categories")}
          </label>
          <select
            name="category_ids"
            multiple
            defaultValue={post?.category_ids ?? []}
            className={`${inputClass} h-32`}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title?.[locale] ?? c.title?.sr ?? c.slug}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-navy mb-1">
            {t("blog.relatedPosts")}
          </label>
          <select
            name="related_post_ids"
            multiple
            defaultValue={post?.related_post_ids ?? []}
            className={`${inputClass} h-32`}
          >
            {otherPosts
              .filter((p) => !post || p.id !== post.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.language.toUpperCase()}] {p.title}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className=\"block text-sm font-medium text-navy mb-2\">
            {t(\"blog.status\")}
          </label>
          <div className=\"flex flex-wrap gap-4 text-sm\">
            {([
              [\"draft\", t(\"blog.statusDraft\")],
              [\"now\", t(\"blog.statusPublishNow\")],
              [\"schedule\", t(\"blog.statusSchedule\")],
            ] as const).map(([value, label]) => (
              <label key={value} className=\"flex items-center gap-2 cursor-pointer\">
                <input
                  type=\"radio\"
                  name=\"status\"
                  value={value}
                  checked={status === value}
                  onChange={() => setStatus(value)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {status === \"schedule\" && (
            <div className=\"mt-3\">
              <input
                type=\"datetime-local\"
                name=\"published_at\"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={nowLocalInput()}
                required
                className={inputClass}
              />
              <p className=\"text-xs text-gray-500 mt-1\">{t(\"blog.scheduleHint\")}</p>
            </div>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="bg-navy text-white px-5 py-2 rounded-md text-sm hover:bg-navy/90"
          >
            {t("common.save")}
          </button>
        </div>
      </form>

      {post?.id && (
        <DeleteForm action={deleteBlogPostAction} id={post.id} locale={locale} />
      )}
    </div>
  );
}
