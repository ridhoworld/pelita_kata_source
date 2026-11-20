import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import { publicFetch } from "@/lib/api";
import type { ArticleSummary, Category, PaginationMeta } from "@/lib/types";

export const revalidate = 60;

interface CategoryPayload {
  category: Category;
  articles: ArticleSummary[];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await publicFetch<CategoryPayload>(`/categories/${slug}/articles`);
  if (!res?.data?.category) return { title: "Kategori Tidak Ditemukan" };
  return {
    title: res.data.category.name,
    description: res.data.category.description || `Artikel rubrik ${res.data.category.name} di Pelita Kata.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const res = await publicFetch<CategoryPayload>(
    `/categories/${slug}/articles?page=${currentPage}&per_page=20`
  );
  if (!res?.data?.category) notFound();

  const { category, articles } = res.data;
  const meta = res.meta as unknown as PaginationMeta;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <header className="border-b-2 border-[var(--ink)] pb-5 space-y-2">
        <div className="text-xs text-[var(--ink-muted)] flex items-center gap-1.5">
          <Link href="/" className="hover:underline">Beranda</Link>
          <span>/</span>
          {category.parent && (
            <>
              <Link href={`/kategori/${category.parent.slug}`} className="hover:underline">
                {category.parent.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[var(--accent)] font-semibold">{category.name}</span>
        </div>
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="text-[var(--ink-muted)] max-w-2xl">{category.description}</p>
        )}
        {category.children && category.children.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-2">
            {category.children.map((ch) => (
              <Link
                key={ch.id}
                href={`/kategori/${ch.slug}`}
                className="px-3 py-1 text-xs font-medium rounded-full border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {ch.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {articles.length === 0 ? (
        <div className="p-10 text-center rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-2">
          <p className="font-editorial text-lg font-semibold">Belum ada artikel di rubrik ini.</p>
          <p className="text-sm text-[var(--ink-muted)]">
            Tim redaksi sedang menyiapkan liputan untuk rubrik {category.name}.
          </p>
          <Link href="/" className="inline-block mt-2 text-sm font-medium text-[var(--accent)] hover:underline">
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
                  href={`/kategori/${slug}?page=${currentPage - 1}`}
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
                  href={`/kategori/${slug}?page=${currentPage + 1}`}
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

