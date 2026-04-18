import type { MetadataRoute } from "next";
import { treatments, b2bServices } from "@/lib/utils";
import { getAllBlogSlugs } from "@/lib/queries";
import { getMockProductSlugs } from "@/lib/mock-products";

const baseUrl = "https://sportcaremed.rs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["sr", "en"];

  const staticPages = [
    "",
    "/usluge",
    "/o-nama",
    "/lokacija",
    "/kontakt",
    "/b2b",
    "/blog",
    "/prodavnica",
    "/alati",
    "/alati/procena-oporavka",
    "/alati/spremnost-za-sport",
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: page === "" ? 1.0 : 0.8,
      });
    }
  }

  // Treatment pages for each locale
  for (const locale of locales) {
    for (const treatment of treatments) {
      entries.push({
        url: `${baseUrl}/${locale}/usluge/${treatment.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // B2B service pages for each locale
  for (const locale of locales) {
    for (const service of b2bServices) {
      entries.push({
        url: `${baseUrl}/${locale}/b2b/${service.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // Product pages for each locale
  const productSlugs = getMockProductSlugs();
  for (const locale of locales) {
    for (const { slug } of productSlugs) {
      entries.push({
        url: `${baseUrl}/${locale}/prodavnica/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  // Blog post pages for each locale
  for (const locale of locales) {
    const slugs = await getAllBlogSlugs(locale);
    for (const { slug } of slugs) {
      entries.push({
        url: `${baseUrl}/${locale}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
