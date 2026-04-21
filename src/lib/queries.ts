import { client } from "./sanity";
import type { BlogPost, BlogCategory, Author, Product, ProductCategory } from "@/types";
import {
  getMockProducts,
  getMockProduct,
  getMockProductSlugs,
  getMockCategories,
  getMockRelatedProducts,
} from "./mock-products";

const BLOG_REVALIDATE = 3600; // 1 hour
const PRODUCT_REVALIDATE = 900; // 15 min

const blogCache = { next: { revalidate: BLOG_REVALIDATE, tags: ["blog"] } };
const productCache = { next: { revalidate: PRODUCT_REVALIDATE, tags: ["products"] } };

async function safeFetch<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    const result = await promise;
    return (result ?? fallback) as T;
  } catch (err) {
    console.error("[sanity] fetch failed:", err);
    return fallback;
  }
}

export async function getBlogPosts(locale: string): Promise<BlogPost[]> {
  if (!client) return [];
  return safeFetch(
    client.fetch(
      `*[_type == "blogPost" && language == $locale] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      "mainImage": mainImage.asset->url,
      publishedAt,
      readingTime,
      language,
      "author": author->{
        _id,
        name,
        role,
        "image": image.asset->url,
        bio
      },
      "categories": categories[]->{ _id, title, slug }
    }`,
      { locale },
      blogCache
    ),
    [] as BlogPost[]
  );
}

export async function getBlogPostsByCategory(
  locale: string,
  categorySlug: string
): Promise<BlogPost[]> {
  if (!client) return [];
  return safeFetch(
    client.fetch(
      `*[_type == "blogPost" && language == $locale && $categorySlug in categories[]->slug.current] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      "mainImage": mainImage.asset->url,
      publishedAt,
      readingTime,
      language,
      "author": author->{
        _id,
        name,
        role,
        "image": image.asset->url,
        bio
      },
      "categories": categories[]->{ _id, title, slug }
    }`,
      { locale, categorySlug },
      blogCache
    ),
    [] as BlogPost[]
  );
}

export async function getBlogPost(
  locale: string,
  slug: string
): Promise<BlogPost | null> {
  if (!client) return null;
  return safeFetch(
    client.fetch(
      `*[_type == "blogPost" && language == $locale && slug.current == $slug][0] {
      _id,
      title,
      slug,
      excerpt,
      body,
      "mainImage": mainImage.asset->url,
      publishedAt,
      readingTime,
      language,
      "author": author->{
        _id,
        name,
        role,
        "image": image.asset->url,
        bio
      },
      "categories": categories[]->{ _id, title, slug },
      "relatedPosts": relatedPosts[]->{
        _id,
        title,
        slug,
        excerpt,
        "mainImage": mainImage.asset->url,
        publishedAt,
        readingTime,
        "categories": categories[]->{ _id, title, slug }
      }
    }`,
      { locale, slug },
      blogCache
    ),
    null as BlogPost | null
  );
}

export async function getBlogCategories(
  locale: string
): Promise<BlogCategory[]> {
  if (!client) return [];
  return safeFetch(
    client.fetch(
      `*[_type == "blogCategory" && language == $locale] | order(title asc) {
      _id,
      title,
      "slug": slug.current
    }`,
      { locale },
      blogCache
    ),
    [] as BlogCategory[]
  );
}

export async function getAuthors(): Promise<Author[]> {
  if (!client) return [];
  return safeFetch(
    client.fetch(
      `*[_type == "author"] | order(name asc) {
      _id,
      name,
      role,
      "image": image.asset->url,
      bio
    }`,
      {},
      blogCache
    ),
    [] as Author[]
  );
}

export async function getAllBlogSlugs(
  locale: string
): Promise<{ slug: string }[]> {
  if (!client) return [];
  return safeFetch(
    client.fetch(
      `*[_type == "blogPost" && language == $locale] {
      "slug": slug.current
    }`,
      { locale },
      blogCache
    ),
    [] as { slug: string }[]
  );
}

// ——— Product queries ———

export async function getProducts(locale: string): Promise<Product[]> {
  if (!client) return getMockProducts(locale);
  const products = await safeFetch(
    client.fetch(
      `*[_type == "product" && active == true] | order(featured desc, _createdAt desc) {
      _id,
      "name": name[$locale],
      "slug": slug.current,
      "description": description[$locale],
      "images": images[].asset->url,
      price,
      compareAtPrice,
      "category": category->{ _id, "title": title[$locale], "slug": slug.current },
      stock,
      featured,
      active
    }`,
      { locale },
      productCache
    ),
    [] as Product[]
  );
  if (products && products.length > 0) return products;
  return getMockProducts(locale);
}

export async function getProduct(
  locale: string,
  slug: string
): Promise<Product | null> {
  if (!client) return getMockProduct(locale, slug);
  const product = await safeFetch(
    client.fetch(
      `*[_type == "product" && slug.current == $slug && active == true][0] {
      _id,
      "name": name[$locale],
      "slug": slug.current,
      "description": description[$locale],
      "images": images[].asset->url,
      price,
      compareAtPrice,
      "category": category->{ _id, "title": title[$locale], "slug": slug.current },
      stock,
      featured,
      active
    }`,
      { locale, slug },
      productCache
    ),
    null as Product | null
  );
  if (product) return product;
  return getMockProduct(locale, slug);
}

export async function getProductCategories(
  locale: string
): Promise<ProductCategory[]> {
  if (!client) return getMockCategories(locale);
  const categories = await safeFetch(
    client.fetch(
      `*[_type == "productCategory"] | order(title[$locale] asc) {
      _id,
      "title": title[$locale],
      "slug": slug.current,
      "description": description[$locale],
      "image": image.asset->url
    }`,
      { locale },
      productCache
    ),
    [] as ProductCategory[]
  );
  if (categories && categories.length > 0) return categories;
  return getMockCategories(locale);
}

export async function getAllProductSlugs(): Promise<{ slug: string }[]> {
  if (!client) return getMockProductSlugs();
  const slugs = await safeFetch(
    client.fetch(
      `*[_type == "product" && active == true] {
      "slug": slug.current
    }`,
      {},
      productCache
    ),
    [] as { slug: string }[]
  );
  if (slugs && slugs.length > 0) return slugs;
  return getMockProductSlugs();
}

export async function getRelatedProducts(
  locale: string,
  slugs: string[]
): Promise<Product[]> {
  if (!slugs || slugs.length === 0) return [];
  if (!client) return getMockRelatedProducts(locale, slugs);
  const products = await safeFetch(
    client.fetch(
      `*[_type == "product" && slug.current in $slugs && active == true] {
      _id,
      "name": name[$locale],
      "slug": slug.current,
      "description": description[$locale],
      "images": images[].asset->url,
      price,
      compareAtPrice,
      "category": category->{ _id, "title": title[$locale], "slug": slug.current },
      stock,
      featured,
      active
    }`,
      { locale, slugs },
      productCache
    ),
    [] as Product[]
  );
  if (products && products.length > 0) return products;
  return getMockRelatedProducts(locale, slugs);
}
