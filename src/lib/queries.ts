import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import type {
  BlogPost,
  BlogCategory,
  Author,
  Product,
  ProductCategory,
} from "@/types";

type Lang = "sr" | "en";

function pickLang(value: unknown, locale: string): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    return String(o[locale] ?? o.sr ?? o.en ?? "");
  }
  return value == null ? "" : String(value);
}

// ============================================================================
// Blog
// ============================================================================

interface BlogPostRow {
  id: string;
  slug: string;
  language: string;
  title: string;
  excerpt: string;
  body_markdown: string | null;
  main_image_url: string | null;
  published_at: string | null;
  reading_time: number;
  author_id: string | null;
  category_ids: string[] | null;
  related_post_ids: string[] | null;
}

interface AuthorRow {
  id: string;
  name: string;
  role: string | null;
  image_url: string | null;
  bio: Record<string, string> | null;
}

interface BlogCategoryRow {
  id: string;
  slug: string;
  title: string;
  language: string;
}

function rowToAuthor(r: AuthorRow | null | undefined, locale: string): Author | undefined {
  if (!r) return undefined;
  return {
    _id: r.id,
    name: r.name,
    role: r.role ?? undefined,
    image: r.image_url ?? undefined,
    bio: pickLang(r.bio, locale),
  };
}

function rowToCategory(r: BlogCategoryRow): BlogCategory {
  return { _id: r.id, title: r.title, slug: r.slug };
}

function rowToBlogPost(
  r: BlogPostRow,
  authorMap: Map<string, AuthorRow>,
  categoryMap: Map<string, BlogCategoryRow>,
  locale: string,
  withBody = false
): BlogPost {
  const cats = (r.category_ids ?? [])
    .map((id) => categoryMap.get(id))
    .filter((c): c is BlogCategoryRow => Boolean(c))
    .map(rowToCategory);
  return {
    _id: r.id,
    title: r.title,
    slug: { current: r.slug },
    excerpt: r.excerpt,
    body: withBody ? r.body_markdown ?? "" : undefined,
    mainImage: r.main_image_url ?? undefined,
    publishedAt: r.published_at ?? "",
    readingTime: r.reading_time,
    language: r.language,
    author: r.author_id ? rowToAuthor(authorMap.get(r.author_id), locale) : undefined,
    categories: cats,
  };
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function fetchAuthorMap(
  supabase: SupabaseServerClient,
  ids: string[]
): Promise<Map<string, AuthorRow>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("blog_authors")
    .select("id, name, role, image_url, bio")
    .in("id", ids);
  return new Map(((data as AuthorRow[]) ?? []).map((r) => [r.id, r]));
}

async function fetchCategoryMap(
  supabase: SupabaseServerClient,
  ids: string[]
): Promise<Map<string, BlogCategoryRow>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("blog_categories")
    .select("id, slug, title, language")
    .in("id", ids);
  return new Map(((data as BlogCategoryRow[]) ?? []).map((r) => [r.id, r]));
}

export async function getBlogPosts(locale: string): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, language, title, excerpt, body_markdown, main_image_url, published_at, reading_time, author_id, category_ids, related_post_ids"
    )
    .eq("language", locale)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  const posts = data as BlogPostRow[];
  const authorIds = Array.from(
    new Set(posts.map((p) => p.author_id).filter((x): x is string => !!x))
  );
  const categoryIds = Array.from(
    new Set(posts.flatMap((p) => p.category_ids ?? []))
  );
  const [authorMap, categoryMap] = await Promise.all([
    fetchAuthorMap(supabase, authorIds),
    fetchCategoryMap(supabase, categoryIds),
  ]);
  return posts.map((p) => rowToBlogPost(p, authorMap, categoryMap, locale));
}

export async function getBlogPostsByCategory(
  locale: string,
  categorySlug: string
): Promise<BlogPost[]> {
  const supabase = await createClient();
  const { data: cat } = await supabase
    .from("blog_categories")
    .select("id")
    .eq("language", locale)
    .eq("slug", categorySlug)
    .maybeSingle();
  if (!cat) return [];
  const { data } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, language, title, excerpt, body_markdown, main_image_url, published_at, reading_time, author_id, category_ids, related_post_ids"
    )
    .eq("language", locale)
    .contains("category_ids", [cat.id])
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  if (!data) return [];
  const posts = data as BlogPostRow[];
  const authorIds = Array.from(
    new Set(posts.map((p) => p.author_id).filter((x): x is string => !!x))
  );
  const categoryIds = Array.from(
    new Set(posts.flatMap((p) => p.category_ids ?? []))
  );
  const [authorMap, categoryMap] = await Promise.all([
    fetchAuthorMap(supabase, authorIds),
    fetchCategoryMap(supabase, categoryIds),
  ]);
  return posts.map((p) => rowToBlogPost(p, authorMap, categoryMap, locale));
}

export async function getBlogPost(
  locale: string,
  slug: string
): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, language, title, excerpt, body_markdown, main_image_url, published_at, reading_time, author_id, category_ids, related_post_ids"
    )
    .eq("language", locale)
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const post = data as BlogPostRow;
  const authorMap = await fetchAuthorMap(
    supabase,
    post.author_id ? [post.author_id] : []
  );
  const categoryMap = await fetchCategoryMap(supabase, post.category_ids ?? []);
  const result = rowToBlogPost(post, authorMap, categoryMap, locale, true);

  const relIds = post.related_post_ids ?? [];
  if (relIds.length > 0) {
    const { data: related } = await supabase
      .from("blog_posts")
      .select(
        "id, slug, language, title, excerpt, body_markdown, main_image_url, published_at, reading_time, author_id, category_ids, related_post_ids"
      )
      .in("id", relIds)
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString());
    if (related && related.length > 0) {
      const relRows = related as BlogPostRow[];
      const relAuthorMap = await fetchAuthorMap(
        supabase,
        relRows.map((r) => r.author_id).filter((x): x is string => !!x)
      );
      const relCatMap = await fetchCategoryMap(
        supabase,
        relRows.flatMap((r) => r.category_ids ?? [])
      );
      result.relatedPosts = relRows.map((r) =>
        rowToBlogPost(r, relAuthorMap, relCatMap, locale)
      );
    }
  }
  return result;
}

export async function getBlogCategories(locale: string): Promise<BlogCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_categories")
    .select("id, slug, title, language")
    .eq("language", locale)
    .order("title", { ascending: true });
  return ((data as BlogCategoryRow[]) ?? []).map(rowToCategory);
}

export async function getAuthors(): Promise<Author[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_authors")
    .select("id, name, role, image_url, bio")
    .order("name", { ascending: true });
  return ((data as AuthorRow[]) ?? [])
    .map((r) => rowToAuthor(r, "sr"))
    .filter((a): a is Author => Boolean(a));
}

export async function getAllBlogSlugs(
  locale: string
): Promise<{ slug: string }[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("language", locale)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString());
  return ((data as { slug: string }[]) ?? []).map((r) => ({ slug: r.slug }));
}

// ============================================================================
// Products
// ============================================================================

interface ProductCategoryRow {
  id: string;
  slug: string;
  title: Record<Lang, string> | null;
  description: Record<Lang, string> | null;
  image_url: string | null;
}

interface ProductRow {
  id: string;
  slug: string;
  name: Record<Lang, string> | null;
  description: Record<Lang, string> | null;
  images: string[] | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  stock: number;
  featured: boolean;
  active: boolean;
  product_type: "physical" | "pdf";
  often_bought_with: string[] | null;
}

function rowToProductCategory(
  r: ProductCategoryRow,
  locale: string
): ProductCategory {
  return {
    _id: r.id,
    title: pickLang(r.title, locale),
    slug: r.slug,
    description: pickLang(r.description, locale),
    image: r.image_url ?? undefined,
  };
}

function rowToProduct(
  r: ProductRow,
  catMap: Map<string, ProductCategoryRow>,
  locale: string
): Product {
  const cat = r.category_id ? catMap.get(r.category_id) : undefined;
  return {
    _id: r.id,
    name: pickLang(r.name, locale),
    slug: r.slug,
    description: pickLang(r.description, locale),
    images: r.images ?? [],
    price: r.price,
    compareAtPrice: r.compare_at_price ?? undefined,
    category: cat ? rowToProductCategory(cat, locale) : undefined,
    stock: r.stock,
    featured: r.featured,
    active: r.active,
    type: r.product_type,
    oftenBoughtWith: r.often_bought_with ?? undefined,
  };
}

async function fetchProductCategoryMap(
  supabase: SupabaseServerClient,
  ids: string[]
): Promise<Map<string, ProductCategoryRow>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("product_categories")
    .select("id, slug, title, description, image_url")
    .in("id", ids);
  return new Map(
    ((data as ProductCategoryRow[]) ?? []).map((r) => [r.id, r])
  );
}

export async function getProducts(locale: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, slug, name, description, images, price, compare_at_price, category_id, stock, featured, active, product_type, often_bought_with"
    )
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (!data) return [];
  const rows = data as ProductRow[];
  const catIds = Array.from(
    new Set(rows.map((r) => r.category_id).filter((x): x is string => !!x))
  );
  const catMap = await fetchProductCategoryMap(supabase, catIds);
  return rows.map((r) => rowToProduct(r, catMap, locale));
}

export async function getProduct(
  locale: string,
  slug: string
): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, slug, name, description, images, price, compare_at_price, category_id, stock, featured, active, product_type, often_bought_with"
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (!data) return null;
  const row = data as ProductRow;
  const catMap = await fetchProductCategoryMap(
    supabase,
    row.category_id ? [row.category_id] : []
  );
  return rowToProduct(row, catMap, locale);
}

export async function getProductCategories(
  locale: string
): Promise<ProductCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_categories")
    .select("id, slug, title, description, image_url")
    .order("sort_order", { ascending: true });
  return ((data as ProductCategoryRow[]) ?? []).map((r) =>
    rowToProductCategory(r, locale)
  );
}

export async function getAllProductSlugs(): Promise<{ slug: string }[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("slug")
    .eq("active", true);
  return ((data as { slug: string }[]) ?? []).map((r) => ({ slug: r.slug }));
}

export async function getRelatedProducts(
  locale: string,
  slugs: string[]
): Promise<Product[]> {
  if (!slugs || slugs.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, slug, name, description, images, price, compare_at_price, category_id, stock, featured, active, product_type, often_bought_with"
    )
    .in("slug", slugs)
    .eq("active", true);
  if (!data) return [];
  const rows = data as ProductRow[];
  const catIds = Array.from(
    new Set(rows.map((r) => r.category_id).filter((x): x is string => !!x))
  );
  const catMap = await fetchProductCategoryMap(supabase, catIds);
  return rows.map((r) => rowToProduct(r, catMap, locale));
}

// ============================================================================
// Discount codes — via Supabase RPC `validate_discount`
// ============================================================================

export interface DiscountCodeDoc {
  _id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
}

export interface DiscountValidationResult {
  valid: boolean;
  reason?: string;
  discount?: DiscountCodeDoc;
  /** Effective percent off subtotal (0 for fixed-amount codes). */
  percent: number;
  /** Effective amount off in RSD. */
  amount: number;
}

export async function validateDiscount(
  rawCode: string,
  subtotal: number
): Promise<DiscountValidationResult> {
  const code = rawCode?.trim();
  if (!code) return { valid: false, reason: "empty", percent: 0, amount: 0 };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_discount", {
    p_code: code,
    p_subtotal: Math.max(0, Math.floor(subtotal || 0)),
  });
  if (error || !data) {
    return { valid: false, reason: "server_error", percent: 0, amount: 0 };
  }
  const r = data as {
    valid: boolean;
    reason?: string;
    code?: string;
    type?: "percent" | "fixed";
    value?: number;
    percent?: number;
    amount?: number;
    discount_id?: string;
  };
  if (!r.valid) {
    return { valid: false, reason: r.reason, percent: 0, amount: 0 };
  }
  return {
    valid: true,
    percent: r.percent ?? 0,
    amount: r.amount ?? 0,
    discount: {
      _id: r.discount_id ?? "",
      code: r.code ?? code.toUpperCase(),
      type: r.type ?? "percent",
      value: r.value ?? 0,
    },
  };
}
