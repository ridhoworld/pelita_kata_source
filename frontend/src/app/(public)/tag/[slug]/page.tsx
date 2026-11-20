import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import { publicFetch } from "@/lib/api";
import type { ArticleSummary, PaginationMeta, Tag } from "@/lib/types";

export const revalidate = 60;

interface TagPayload {
  tag: Tag;
  articles: ArticleSummary[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await publicFetch<TagPayload>(`/tags/${slug}/articles`);
  if (!res?.data?.tag) return { title: "Topik Tidak Ditemukan" };
  return {
    title: `#${res.data.tag.name}`,
    description: `Kumpulan artikel bertopik ${res.data.tag.name} di Pelita Kata.`,
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const res = await publicFetch<TagPayload>(`/tags/${slug}/articles?page=${currentPage}&per_page=20`);
  if (!res?.data?.tag) notFound();

  const { tag, articles } = res.data;
  const meta = res.meta as unknown as PaginationMeta;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="border-b-2 border-[var(--ink)] pb-5 space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">Topik</div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold">#{tag.name}</h1>
      </header>

      {articles.length === 0 ? (
        <div className="p-10 text-center rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-2">
          <p className="font-editorial text-lg font-semibold">Belum ada artikel untuk topik ini.</p>
          <Link href="/" className="inline-block text-sm font-medium text-[var(--accent)] hover:underline">
            ← Kembali ke Beranda
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {meta && meta.last_page > 1 && (
            <nav aria-label="Navigasi halaman" className="flex items-center justify-center gap-3 pt-4">
              {currentPage > 1 && (
                <Link
                  href={`/tag/${slug}?page=${currentPage - 1}`}
                  className="px-4 py-2 text-sm rounded border border-[var(--border)] hover:bg-[var(--surface)]"
                >
                  ← Sebelumnya
                </Link>
              )}
              <span className="text-sm text-[var(--ink-muted)]">
                Halaman {meta.current_page} dari {meta.last_page}
              </span>
              {currentPage < meta.last_page && (
                <Link
                  href={`/tag/${slug}?page=${currentPage + 1}`}
                  className="px-4 py-2 text-sm rounded border border-[var(--border)] hover:bg-[var(--surface)]"
                >
                  Berikutnya →
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

