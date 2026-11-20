"use client";

import { useState } from "react";
import ArticleCard from "./ArticleCard";
import type { ArticleSummary } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface Props {
  initialArticles: ArticleSummary[];
}

export default function LatestArticlesFeed({ initialArticles }: Props) {
  const [articles, setArticles] = useState<ArticleSummary[]>(initialArticles);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialArticles.length >= 12);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`${API_URL}/articles?per_page=20&page=${nextPage}`, {
        headers: { Accept: "application/json" },
      });
      const json = await res.json();
      const incoming: ArticleSummary[] = json?.data || [];
      if (incoming.length === 0) {
        setHasMore(false);
        return;
      }
      setArticles((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        const unique = incoming.filter((a) => !seen.has(a.id));
        return [...prev, ...unique];
      });
      setPage(nextPage);
      const lastPage = json?.meta?.last_page ?? nextPage;
      setHasMore(nextPage < lastPage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={loadMore}
            className="px-6 py-2.5 text-sm font-semibold rounded-md border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Muat Lebih Banyak"}
          </button>
        </div>
      )}
    </div>
  );
}

