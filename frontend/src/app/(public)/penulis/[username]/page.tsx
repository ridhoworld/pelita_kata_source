import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { User } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import { publicFetch } from "@/lib/api";
import type { ArticleSummary, AuthorSummary, PaginationMeta } from "@/lib/types";

export const revalidate = 60;

interface AuthorPayload {
  author: AuthorSummary;
  articles: ArticleSummary[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const res = await publicFetch<AuthorPayload>(`/authors/${username}`);
  if (!res?.data?.author) return { title: "Penulis Tidak Ditemukan" };
  return {
    title: `${res.data.author.name} — Penulis`,
    description: res.data.author.bio || `Daftar artikel oleh ${res.data.author.name} di Pelita Kata.`,
  };
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { username } = await params;
  const { page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const res = await publicFetch<AuthorPayload>(`/authors/${username}?page=${currentPage}&per_page=20`);
  if (!res?.data?.author) notFound();

  const { author, articles } = res.data;
  const meta = res.meta as unknown as PaginationMeta;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="p-6 rounded-md border border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-[var(--paper)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden">
          {author.avatar ? (
            <img
              src={author.avatar.file_url}
              alt={author.avatar.alt_text}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-[var(--ink-muted)]" />
          )}
        </div>
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            Profil Penulis · {author.articles_count} Artikel Terbit
          </div>
          <h1 className="font-editorial text-3xl font-bold">{author.name}</h1>
          {author.bio && <p className="text-sm text-[var(--ink-muted)] max-w-2xl">{author.bio}</p>}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {meta && meta.last_page > 1 && (
        <nav aria-label="Navigasi halaman" className="flex items-center justify-center gap-3 pt-4">
          {currentPage > 1 && (
            <Link
              href={`/penulis/${username}?page=${currentPage - 1}`}
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
              href={`/penulis/${username}?page=${currentPage + 1}`}
              className="px-4 py-2 text-sm rounded border border-[var(--border)] hover:bg-[var(--surface)]"
            >
              Berikutnya →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

