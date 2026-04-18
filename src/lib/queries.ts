import { client } from "./sanity";
import type { BlogPost, BlogCategory, Author, Product, ProductCategory } from "@/types";
import {
  getMockProducts,
  getMockProduct,
  getMockProductSlugs,
  getMockCategories,
  getMockRelatedProducts,
} from "./mock-products";

export async function getBlogPosts(locale: string): Promise<BlogPost[]> {
  if (!client) return [];
  return client.fetch(
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
    { locale }
  );
}

export async function getBlogPostsByCategory(
  locale: string,
  categorySlug: string
): Promise<BlogPost[]> {
  if (!client) return [];
  return client.fetch(
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
    { locale, categorySlug }
  );
}

export async function getBlogPost(
  locale: string,
  slug: string
): Promise<BlogPost | null> {
  if (!client) return null;
  return client.fetch(
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
    { locale, slug }
  );
}

export async function getBlogCategories(
  locale: string
): Promise<BlogCategory[]> {
  if (!client) return [];
  return client.fetch(
    `*[_type == "blogCategory" && language == $locale] | order(title asc) {
      _id,
      title,
      "slug": slug.current
    }`,
    { locale }
  );
}

export async function getAuthors(): Promise<Author[]> {
  if (!client) return [];
  return client.fetch(
    `*[_type == "author"] | order(name asc) {
      _id,
      name,
      role,
      "image": image.asset->url,
      bio
    }`
  );
}

export async function getAllBlogSlugs(
  locale: string
): Promise<{ slug: string }[]> {
  if (!client) return [];
  return client.fetch(
    `*[_type == "blogPost" && language == $locale] {
      "slug": slug.current
    }`,
    { locale }
  );
}

// ——— Product queries ———

export async function getProducts(locale: string): Promise<Product[]> {
  if (!client) return getMockProducts(locale);
  const products = await client.fetch(
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
    { locale }
  );
  if (products && products.length > 0) return products;
  return getMockProducts(locale);
}

export async function getProduct(
  locale: string,
  slug: string
): Promise<Product | null> {
  if (!client) return getMockProduct(locale, slug);
  const product = await client.fetch(
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
    { locale, slug }
  );
  if (product) return product;
  return getMockProduct(locale, slug);
}

export async function getProductCategories(
  locale: string
): Promise<ProductCategory[]> {
  if (!client) return getMockCategories(locale);
  const categories = await client.fetch(
    `*[_type == "productCategory"] | order(title[$locale] asc) {
      _id,
      "title": title[$locale],
      "slug": slug.current,
      "description": description[$locale],
      "image": image.asset->url
    }`,
    { locale }
  );
  if (categories && categories.length > 0) return categories;
  return getMockCategories(locale);
}

export async function getAllProductSlugs(): Promise<{ slug: string }[]> {
  if (!client) return getMockProductSlugs();
  const slugs = await client.fetch(
    `*[_type == "product" && active == true] {
      "slug": slug.current
    }`
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
  const products = await client.fetch(
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
    { locale, slugs }
  );
  if (products && products.length > 0) return products;
  return getMockRelatedProducts(locale, slugs);
}
