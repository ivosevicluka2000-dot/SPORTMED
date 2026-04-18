import { getBlogPosts } from "@/lib/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "sr";
  const posts = await getBlogPosts(locale);

  const siteUrl = "https://sportcaremed.rs";
  const blogTitle =
    locale === "sr"
      ? "Sport Care Med Blog"
      : "Sport Care Med Blog";
  const blogDescription =
    locale === "sr"
      ? "Saveti, vesti i stručni članci iz sveta sportske medicine"
      : "Tips, news and expert articles from the world of sports medicine";

  const rssItems = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/${locale}/blog/${post.slug.current}</link>
      <guid isPermaLink="true">${siteUrl}/${locale}/blog/${post.slug.current}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      ${post.author ? `<author>${post.author.name}</author>` : ""}
      ${post.categories?.map((c) => `<category>${c.title}</category>`).join("\n      ") || ""}
    </item>`
    )
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${blogTitle}</title>
    <link>${siteUrl}/${locale}/blog</link>
    <description>${blogDescription}</description>
    <language>${locale}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/api/rss?locale=${locale}" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
