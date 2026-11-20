import type { MetadataRoute } from "next";
import { publicFetch } from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface SitemapData {
  articles: { slug: string; updated_at: string }[];
  categories: { slug: string; updated_at: string }[];
  tags: { slug: string; updated_at: string }[];
  pages: { slug: string; updated_at: string }[];
  authors: { username: string; updated_at: string }[];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await publicFetch<SitemapData>("/sitemap-data", { revalidate: 300 });
  const data = res?.data;

  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
  ];

  if (!data) return entries;

  for (const a of data.articles || []) {
    entries.push({
      url: `${SITE_URL}/baca/${a.slug}`,
      lastModified: a.updated_at ? new Date(a.updated_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });
  }
  for (const c of data.categories || []) {
    entries.push({
      url: `${SITE_URL}/kategori/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }
  for (const t of data.tags || []) {
    entries.push({
      url: `${SITE_URL}/tag/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }
  for (const p of data.pages || []) {
    entries.push({
      url: `${SITE_URL}/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }
  for (const au of data.authors || []) {
    entries.push({
      url: `${SITE_URL}/penulis/${au.username}`,
      lastModified: au.updated_at ? new Date(au.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return entries;
}

