import { publicFetch } from "@/lib/api";
import type { ArticleSummary } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const res = await publicFetch<ArticleSummary[]>("/articles?per_page=30", { revalidate: 300 });
  const articles = res?.data || [];

  const itemsXml = articles
    .map((a) => {
      const link = `${SITE_URL}/baca/${a.slug}`;
      const pubDate = a.published_at ? new Date(a.published_at).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(a.excerpt || "")}</description>
      <pubDate>${pubDate}</pubDate>
      ${a.category ? `<category>${escapeXml(a.category.name)}</category>` : ""}
      ${a.author ? `<author>${escapeXml(a.author.name)}</author>` : ""}
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pelita Kata</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Publikasi artikel jurnalistik gratis, non-komersial, berfokus pada isu lokal, literasi, opini publik, dan liputan mendalam.</description>
    <language>id-ID</language>
    <atom:link href="${escapeXml(SITE_URL)}/rss.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

