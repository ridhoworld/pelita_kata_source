"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Search } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import type { ArticleSummary, PaginationMeta } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";
  const [input, setInput] = useState(initialQ);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");

  useEffect(() => {
    setInput(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed.length < 3) {
      setArticles([]);
      setMeta(null);
      setSearchedQuery("");
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/search?q=${encodeURIComponent(trimmed)}&page=${page}&per_page=20`,
          { headers: { Accept: "application/json" } }
        );
        const json = await res.json();
        if (res.ok && json?.data) {
          setArticles(json.data.articles || []);
          setSuggestions(json.data.suggestions || []);
          setMeta(json.meta || null);
          setSearchedQuery(trimmed);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input, page]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed.length < 3) return;
    setPage(1);
    router.replace(`/cari?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <header className="space-y-4">
        <h1 className="font-editorial text-3xl font-bold">Pencarian Artikel</h1>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setPage(1);
              }}
              placeholder="Ketik minimal 3 karakter (misal: transportasi, literasi, air bersih)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-md border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={input.trim().length < 3}
            className="px-5 py-2.5 text-sm font-semibold rounded-md bg-[var(--accent)] text-white disabled:opacity-50"
          >
            Cari
          </button>
        </form>
        {input.trim().length > 0 && input.trim().length < 3 && (
          <p className="text-xs text-[var(--ink-muted)]">Masukkan minimal 3 karakter untuk memulai pencarian.</p>
        )}
      </header>

      {loading && (
        <p className="text-sm text-[var(--ink-muted)]">Mencari artikel...</p>
      )}

      {!loading && searchedQuery && (
        <div className="space-y-6">
          <p className="text-sm text-[var(--ink-muted)]">
            Ditemukan <strong>{meta?.total ?? articles.length}</strong> hasil untuk{" "}
            <strong>&ldquo;{searchedQuery}&rdquo;</strong>
          </p>

          {articles.length === 0 ? (
            <div className="p-8 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-4">
              <p className="font-editorial text-lg font-semibold">
                Tidak ada artikel yang cocok dengan kata kunci tersebut.
              </p>
              <p className="text-sm text-[var(--ink-muted)]">
                Coba gunakan kata kunci yang lebih umum atau pilih topik saran berikut:
              </p>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setInput(s);
                        setPage(1);
                        router.replace(`/cari?q=${encodeURIComponent(s)}`);
                      }}
                      className="px-3 py-1 text-xs rounded-full border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 text-sm rounded border border-[var(--border)] disabled:opacity-40"
                  >
                    ← Sebelumnya
                  </button>
                  <span className="text-sm text-[var(--ink-muted)]">
                    Halaman {meta.current_page} dari {meta.last_page}
                  </span>
                  <button
                    type="button"
                    disabled={page >= meta.last_page}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 text-sm rounded border border-[var(--border)] disabled:opacity-40"
                  >
                    Berikutnya →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8 text-sm">Memuat pencarian...</div>}>
      <SearchInner />
    </Suspense>
  );
}

