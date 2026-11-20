import Link from "next/link";
import { Clock } from "lucide-react";
import type { ArticleSummary } from "@/lib/types";
import { ARTICLE_TYPE_LABEL, buildSrcSet, formatShortDate } from "@/lib/api";

interface Props {
  article: ArticleSummary;
  variant?: "hero" | "standard" | "compact";
  priority?: boolean;
}

export default function ArticleCard({ article, variant = "standard", priority = false }: Props) {
  const img = article.featured_image || article.featuredImage;
  const typeLabel = ARTICLE_TYPE_LABEL[article.article_type] || "Berita";

  if (variant === "hero") {
    return (
      <article className="group grid grid-cols-1 lg:grid-cols-12 gap-6 items-center border-b border-[var(--border)] pb-8">
        <Link
          href={`/baca/${article.slug}`}
          className="lg:col-span-7 block overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-800 aspect-[16/9]"
        >
          {img ? (
            <img
              src={img.file_url}
              srcSet={buildSrcSet(img.variants)}
              sizes="(max-width: 1024px) 100vw, 60vw"
              alt={img.alt_text}
              width={img.width || 1200}
              height={img.height || 675}
              fetchPriority={priority ? "high" : "auto"}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-[var(--ink-muted)]">
              Pelita Kata
            </div>
          )}
        </Link>
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            {article.category && (
              <Link href={`/kategori/${article.category.slug}`} className="text-[var(--accent)] hover:underline">
                {article.category.name}
              </Link>
            )}
            <span className="text-[var(--ink-muted)]">·</span>
            <span className="text-[var(--ink-muted)]">{typeLabel}</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold leading-snug text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
            <Link href={`/baca/${article.slug}`}>{article.title}</Link>
          </h2>
          {article.excerpt && (
            <p className="text-[var(--ink-muted)] leading-relaxed line-clamp-3">{article.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--ink-muted)] pt-1">
            {article.author && (
              <Link href={`/penulis/${article.author.username}`} className="font-medium text-[var(--ink)] hover:underline">
                {article.author.name}
              </Link>
            )}
            <span>·</span>
            <time dateTime={article.published_at || ""}>{formatShortDate(article.published_at)}</time>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {article.reading_time} mnt baca
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group py-3 border-b border-[var(--border)] last:border-b-0">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-1">
          {article.category && <span>{article.category.name}</span>}
        </div>
        <h3 className="font-editorial text-base font-bold leading-snug text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
          <Link href={`/baca/${article.slug}`}>{article.title}</Link>
        </h3>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--ink-muted)]">
          {article.author && <span>{article.author.name}</span>}
          <span>·</span>
          <time dateTime={article.published_at || ""}>{formatShortDate(article.published_at)}</time>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-md overflow-hidden hover:border-[var(--ink-muted)] transition-colors">
      <Link
        href={`/baca/${article.slug}`}
        className="block overflow-hidden bg-zinc-200 dark:bg-zinc-800 aspect-[16/9]"
      >
        {img ? (
          <img
            src={img.file_url}
            srcSet={buildSrcSet(img.variants)}
            sizes="(max-width: 768px) 100vw, 33vw"
            alt={img.alt_text}
            width={img.width || 640}
            height={img.height || 360}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--ink-muted)]">
            Pelita Kata
          </div>
        )}
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
          {article.category && (
            <Link href={`/kategori/${article.category.slug}`} className="text-[var(--accent)] hover:underline">
              {article.category.name}
            </Link>
          )}
          <span className="text-[var(--ink-muted)]">· {typeLabel}</span>
        </div>
        <h3 className="font-editorial text-lg font-bold leading-snug text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
          <Link href={`/baca/${article.slug}`}>{article.title}</Link>
        </h3>
        {article.excerpt && (
          <p className="mt-2 text-sm text-[var(--ink-muted)] line-clamp-2 flex-1">{article.excerpt}</p>
        )}
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--ink-muted)]">
          <span className="truncate">
            {article.author ? article.author.name : "Redaksi"}
          </span>
          <span className="shrink-0">
            {formatShortDate(article.published_at)} · {article.reading_time} mnt
          </span>
        </div>
      </div>
    </article>
  );
}

