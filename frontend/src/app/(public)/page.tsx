import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import LatestArticlesFeed from "@/components/LatestArticlesFeed";
import { publicFetch } from "@/lib/api";
import type { ArticleSummary, Category } from "@/lib/types";

export const revalidate = 60;

interface HomeData {
  breaking: {
    id: number;
    title: string;
    slug: string;
    published_at: string;
    category: { name: string; slug: string } | null;
  }[];
  headlines: ArticleSummary[];
  latest: ArticleSummary[];
  rubrics: {
    category: Category;
    articles: ArticleSummary[];
  }[];
}

export default async function HomePage() {
  const res = await publicFetch<HomeData>("/home", { revalidate: 60 });
  const data = res?.data;

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-3">
        <h1 className="font-editorial text-3xl font-bold">Pelita Kata</h1>
        <p className="text-[var(--ink-muted)]">
          Sedang memuat edisi terbaru. Pastikan server API Laravel aktif di{" "}
          <code>http://127.0.0.1:8000</code>.
        </p>
      </div>
    );
  }

  const [mainHeadline, ...otherHeadlines] = data.headlines || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-12">
      {/* Breaking News Strip (FR-P-01) */}
      {data.breaking && data.breaking.length > 0 && (
        <section
          aria-label="Berita Terkini"
          className="rounded-md border border-red-200 dark:border-red-900/60 bg-[var(--accent-soft)] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
        >
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            Terkini
          </span>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 overflow-x-auto text-sm">
            {data.breaking.map((item) => (
              <Link
                key={item.id}
                href={`/baca/${item.slug}`}
                className="font-medium text-[var(--ink)] hover:text-[var(--accent)] truncate"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Headline Block (max 5 featured) */}
      {mainHeadline && (
        <section aria-label="Berita Utama" className="space-y-6">
          <h1 className="sr-only">Pelita Kata — Berita Utama dan Liputan Mendalam</h1>
          <ArticleCard article={mainHeadline} variant="hero" priority />

          {otherHeadlines.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {otherHeadlines.slice(0, 4).map((article) => (
                <ArticleCard key={article.id} article={article} variant="standard" />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Latest Articles */}
      {data.latest && data.latest.length > 0 && (
        <section aria-labelledby="heading-terbaru" className="space-y-5">
          <div className="flex items-center justify-between border-b-2 border-[var(--ink)] pb-2">
            <h2 id="heading-terbaru" className="font-editorial text-2xl font-bold">
              Terbaru
            </h2>
            <Link
              href="/cari?q=artikel"
              className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:underline"
            >
              Telusuri Arsip →
            </Link>
          </div>
          <LatestArticlesFeed initialArticles={data.latest} />
        </section>
      )}

      {/* Blocks per Rubric (3 articles/rubric) */}
      {data.rubrics && data.rubrics.length > 0 && (
        <section aria-label="Rubrik Pilihan" className="space-y-10">
          {data.rubrics.map((rubric) => (
            <div key={rubric.category.id} className="space-y-4">
              <div className="flex items-end justify-between border-b border-[var(--border)] pb-2">
                <div>
                  <h2 className="font-editorial text-xl font-bold">{rubric.category.name}</h2>
                  {rubric.category.description && (
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                      {rubric.category.description}
                    </p>
                  )}
                </div>
                <Link
                  href={`/kategori/${rubric.category.slug}`}
                  className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] hover:underline shrink-0"
                >
                  Lihat Semua →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {rubric.articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

