import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { AlertCircle, Clock, User } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import ShareButtons from "@/components/ShareButtons";
import ViewTracker from "@/components/ViewTracker";
import { ARTICLE_TYPE_LABEL, buildSrcSet, formatDateWIB, publicFetch } from "@/lib/api";
import type { ArticleDetail, ArticleSummary } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

interface DetailPayload {
  redirect_to?: string;
  article?: ArticleDetail;
  related?: ArticleSummary[];
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview_token?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { preview_token } = await searchParams;
  const qs = preview_token ? `?preview_token=${encodeURIComponent(preview_token)}` : "";
  const res = await publicFetch<DetailPayload>(`/articles/${slug}${qs}`, {
    cache: preview_token ? "no-store" : undefined,
    revalidate: 60,
  });

  if (!res?.data?.article) {
    return { title: "Artikel Tidak Ditemukan" };
  }

  const a = res.data.article;
  const title = a.seo?.meta_title || a.title;
  const description = a.seo?.meta_description || a.excerpt || "";
  const ogImage = a.seo?.og_image_url || a.featured_image?.file_url;

  return {
    title,
    description,
    alternates: {
      canonical: a.seo?.canonical_url || `${SITE_URL}/baca/${a.slug}`,
    },
    robots: a.is_preview ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE_URL}/baca/${a.slug}`,
      publishedTime: a.published_at || undefined,
      modifiedTime: a.updated_at || undefined,
      authors: a.author ? [a.author.name] : undefined,
      images: ogImage ? [{ url: ogImage, alt: a.featured_image?.alt_text || a.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ArticleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview_token?: string }>;
}) {
  const { slug } = await params;
  const { preview_token } = await searchParams;
  const qs = preview_token ? `?preview_token=${encodeURIComponent(preview_token)}` : "";
  const res = await publicFetch<DetailPayload>(`/articles/${slug}${qs}`, {
    cache: preview_token ? "no-store" : undefined,
    revalidate: 60,
  });

  if (res?.data?.redirect_to) {
    permanentRedirect(`/baca/${res.data.redirect_to}`);
  }

  if (!res?.data?.article) {
    notFound();
  }

  const { article, related = [] } = res.data;
  const articleUrl = `${SITE_URL}/baca/${article.slug}`;
  const img = article.featured_image;
  const typeLabel = ARTICLE_TYPE_LABEL[article.article_type] || "Berita";

  const newsArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || "",
    image: img ? [img.file_url] : undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: article.author
      ? {
          "@type": "Person",
          name: article.author.name,
          url: `${SITE_URL}/penulis/${article.author.username}`,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Pelita Kata",
      url: SITE_URL,
    },
    mainEntityOfPage: articleUrl,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
      ...(article.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: article.category.name,
              item: `${SITE_URL}/kategori/${article.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: article.category ? 3 : 2,
        name: article.title,
        item: articleUrl,
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {!article.is_preview && <ViewTracker slug={article.slug} />}

      {article.is_preview && (
        <div className="mb-6 p-3 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-sm font-medium">
          Mode Pratinjau Redaksi — Artikel ini berstatus <strong>{article.status}</strong> dan belum tayang untuk publik.
        </div>
      )}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-[var(--ink-muted)] mb-4 flex flex-wrap items-center gap-1.5">
        <Link href="/" className="hover:underline">
          Beranda
        </Link>
        {article.category?.parent && (
          <>
            <span>/</span>
            <Link href={`/kategori/${article.category.parent.slug}`} className="hover:underline">
              {article.category.parent.name}
            </Link>
          </>
        )}
        {article.category && (
          <>
            <span>/</span>
            <Link
              href={`/kategori/${article.category.slug}`}
              className="text-[var(--accent)] font-semibold hover:underline"
            >
              {article.category.name}
            </Link>
          </>
        )}
      </nav>

      <article>
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            <span>{typeLabel}</span>
            {article.category && (
              <>
                <span className="text-[var(--ink-muted)]">·</span>
                <Link href={`/kategori/${article.category.slug}`} className="hover:underline">
                  {article.category.name}
                </Link>
              </>
            )}
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[2.6rem] font-bold leading-tight text-[var(--ink)]">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-lg text-[var(--ink-muted)] leading-relaxed">{article.excerpt}</p>
          )}

          {/* Journalistic Metadata (US-R-02 AC1) */}
          <div className="py-4 border-y border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[var(--ink-muted)]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Penulis:{" "}
                  {article.author ? (
                    <Link
                      href={`/penulis/${article.author.username}`}
                      className="font-semibold text-[var(--ink)] hover:text-[var(--accent)] hover:underline"
                    >
                      {article.author.name}
                    </Link>
                  ) : (
                    <strong className="text-[var(--ink)]">Redaksi</strong>
                  )}
                </span>
                {article.editor && (
                  <>
                    <span>·</span>
                    <span>
                      Editor: <strong className="text-[var(--ink)]">{article.editor.name}</strong>
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {article.published_at && (
                  <time dateTime={article.published_at}>
                    Tayang: {formatDateWIB(article.published_at)}
                  </time>
                )}
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Waktu baca {article.reading_time} menit
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Corrections / Updates Box (US-R-02 AC3) */}
        {article.corrections && article.corrections.length > 0 && (
          <aside
            aria-label="Catatan Ralat dan Pembaruan"
            className="mt-6 p-4 rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 space-y-2"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4" />
              Catatan Ralat &amp; Pembaruan Redaksi
            </div>
            <ul className="space-y-2 text-sm text-amber-950 dark:text-amber-100">
              {article.corrections.map((c) => (
                <li key={c.id} className="leading-relaxed">
                  <span className="font-semibold">
                    [{c.type === "correction" ? "Ralat" : "Pembaruan"} — {formatDateWIB(c.created_at)}]
                  </span>{" "}
                  {c.note}
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Featured Image + Caption + Credit (US-R-02 AC2) */}
        {img && (
          <figure className="my-7">
            <div className="overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-800">
              <img
                src={img.file_url}
                srcSet={buildSrcSet(img.variants)}
                sizes="(max-width: 896px) 100vw, 896px"
                alt={img.alt_text}
                width={img.width || 1200}
                height={img.height || 675}
                fetchPriority="high"
                className="w-full h-auto object-cover"
              />
            </div>
            <figcaption className="mt-2 text-xs text-[var(--ink-muted)] leading-relaxed flex flex-col sm:flex-row sm:justify-between gap-1">
              <span>{img.caption || img.alt_text}</span>
              <span className="font-medium shrink-0">Kredit: {img.credit_source}</span>
            </figcaption>
          </figure>
        )}

        {/* Sanitized Body */}
        <div
          className="article-prose max-w-3xl mx-auto my-8"
          dangerouslySetInnerHTML={{ __html: article.content_html || "" }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="max-w-3xl mx-auto mt-8 pt-6 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] mr-1">
              Topik:
            </span>
            {article.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="px-3 py-1 text-xs rounded-full border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Share Buttons (US-R-06) */}
        <div className="max-w-3xl mx-auto mt-6 pt-6 border-t border-[var(--border)]">
          <ShareButtons title={article.title} url={articleUrl} />
        </div>

        {/* Author Box */}
        {article.author && (
          <section
            aria-label="Tentang Penulis"
            className="max-w-3xl mx-auto mt-8 p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--paper)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden">
              {article.author.avatar ? (
                <img
                  src={article.author.avatar.file_url}
                  alt={article.author.avatar.alt_text}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-[var(--ink-muted)]" />
              )}
            </div>
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-[var(--ink-muted)]">Penulis</div>
              <Link
                href={`/penulis/${article.author.username}`}
                className="font-editorial text-lg font-bold hover:text-[var(--accent)]"
              >
                {article.author.name}
              </Link>
              {article.author.bio && (
                <p className="text-sm text-[var(--ink-muted)] leading-relaxed">{article.author.bio}</p>
              )}
            </div>
          </section>
        )}

        {/* Reader correction prompt (A3: no comments, direct contact) */}
        <div className="max-w-3xl mx-auto mt-6 text-xs text-[var(--ink-muted)] bg-[var(--surface)] border border-[var(--border)] rounded-md p-4">
          Menemukan kekeliruan data atau ingin menyampaikan tanggapan maupun Hak Jawab?{" "}
          <Link href="/kontak" className="text-[var(--accent)] font-medium hover:underline">
            Hubungi redaksi Pelita Kata →
          </Link>
        </div>
      </article>

      {/* Related Articles (max 4) */}
      {related && related.length > 0 && (
        <section aria-labelledby="heading-terkait" className="mt-14 pt-8 border-t-2 border-[var(--ink)]">
          <h2 id="heading-terkait" className="font-editorial text-2xl font-bold mb-6">
            Artikel Terkait
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {related.map((item) => (
              <ArticleCard key={item.id} article={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

