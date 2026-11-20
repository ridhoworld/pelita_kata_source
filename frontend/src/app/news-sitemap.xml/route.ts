import { publicFetch } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface NewsItem {
  slug: string;
  title: string;
  published_at: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const res = await publicFetch<NewsItem[]>("/news-sitemap-data", { revalidate: 300 });
  const items = res?.data || [];

  const urlsXml = items
    .map(
      (a) => `  <url>
    <loc>${escapeXml(`${SITE_URL}/baca/${a.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>Pelita Kata</news:name>
        <news:language>id</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(a.published_at)}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
    </news:news>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlsXml}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

