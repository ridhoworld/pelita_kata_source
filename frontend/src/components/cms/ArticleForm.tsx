"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Eye,
  Send,
  CheckCircle2,
  Clock,
  RotateCcw,
  Archive,
  AlertCircle,
  Image as ImageIcon,
  History,
  Trash2,
} from "lucide-react";
import { cmsFetch, formatDateWIB, STATUS_LABEL } from "@/lib/api";
import type { ArticleCorrection, ArticleDetail, Category, MediaItem, Tag } from "@/lib/types";
import { useCmsAuth } from "./CmsAuthContext";
import RichTextEditor from "./RichTextEditor";
import MediaPickerModal from "./MediaPickerModal";

interface RevisionItem {
  id: number;
  title_snapshot: string;
  content_snapshot?: { html?: string; json?: Record<string, unknown> } | null;
  status_snapshot: string;
  revision_note: string | null;
  created_at: string;
  editor?: { id: number; name: string };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function computeWordDiff(oldText: string, newText: string): { type: "same" | "add" | "del"; word: string }[] {
  const a = oldText ? oldText.split(" ") : [];
  const b = newText ? newText.split(" ") : [];
  const m = Math.min(a.length, 400);
  const n = Math.min(b.length, 400);
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: { type: "same" | "add" | "del"; word: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ type: "same", word: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", word: a[i] });
      i++;
    } else {
      out.push({ type: "add", word: b[j] });
      j++;
    }
  }
  while (i < m) out.push({ type: "del", word: a[i++] });
  while (j < n) out.push({ type: "add", word: b[j++] });
  return out;
}

interface Props {
  articleId?: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ArticleForm({ articleId }: Props) {
  const router = useRouter();
  const { user, isEditor, isAdmin } = useCmsAuth();

  const [tab, setTab] = useState<"editor" | "seo" | "revisions" | "corrections">("editor");
  const [loading, setLoading] = useState(!!articleId);
  const [saving, setSaving] = useState(false);
  const [savedLabel, setSavedLabel] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Taxonomy
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Article fields
  const [id, setId] = useState<number | undefined>(articleId);
  const [status, setStatus] = useState<ArticleDetail["status"]>("draft");
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [articleType, setArticleType] = useState<ArticleDetail["article_type"]>("news");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [featuredImage, setFeaturedImage] = useState<MediaItem | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);

  // Content
  const [initialHtml, setInitialHtml] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({});
  const [wordCount, setWordCount] = useState(0);

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");

  // Revisions & Corrections
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [diffRevision, setDiffRevision] = useState<RevisionItem | null>(null);
  const [corrections, setCorrections] = useState<ArticleCorrection[]>([]);
  const [corrType, setCorrType] = useState<"correction" | "update">("correction");
  const [corrNote, setCorrNote] = useState("");

  // Modals / Workflow inputs
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [returnNoteInput, setReturnNoteInput] = useState("");
  const [showReturnBox, setShowReturnBox] = useState(false);
  const [showScheduleBox, setShowScheduleBox] = useState(false);
  const [editorRevisionNote, setEditorRevisionNote] = useState("");

  const dirtyRef = useRef(false);

  const readOnly = !isEditor && status !== "draft";

  const loadArticle = useCallback(async (targetId: number) => {
    setLoading(true);
    try {
      const res = await cmsFetch<ArticleDetail>(`/cms/articles/${targetId}`);
      const a = res.data;
      setId(a.id);
      setStatus(a.status);
      setReviewNote(a.review_note || null);
      setTitle(a.title);
      setSlug(a.slug);
      setSlugTouched(true);
      setExcerpt(a.excerpt || "");
      setCategoryId(a.category?.id || 0);
      setArticleType(a.article_type || "news");
      setSelectedTagIds((a.tags || []).map((t) => t.id));
      setFeaturedImage(a.featured_image || a.featuredImage || null);
      setIsFeatured(!!a.is_featured);
      setIsBreaking(!!a.is_breaking);
      setInitialHtml(a.content_html || "");
      setContentHtml(a.content_html || "");
      setContentJson(a.content_json || {});
      setMetaTitle(a.seo?.meta_title || "");
      setMetaDescription(a.seo?.meta_description || "");
      setCanonicalUrl(a.seo?.canonical_url || "");
      setOgImageUrl(a.seo?.og_image_url || "");
      setCorrections(a.corrections || []);
      const words = (a.content_html || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat artikel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      cmsFetch<Category[]>("/cms/categories"),
      cmsFetch<Tag[]>("/cms/tags"),
    ])
      .then(([catRes, tagRes]) => {
        setCategories(catRes.data || []);
        setTags(tagRes.data || []);
        if (!articleId && catRes.data?.length) {
          setCategoryId(catRes.data[0].id);
        }
      })
      .catch(() => {});

    if (articleId) {
      loadArticle(articleId);
    }
  }, [articleId, loadArticle]);

  const loadRevisions = useCallback(async () => {
    if (!id) return;
    const res = await cmsFetch<RevisionItem[]>(`/cms/articles/${id}/revisions`).catch(() => null);
    if (res?.data) setRevisions(res.data);
  }, [id]);

  useEffect(() => {
    if (tab === "revisions" && id) loadRevisions();
  }, [tab, id, loadRevisions]);

  const buildPayload = (isAutosave = false) => ({
    title,
    slug: slug || undefined,
    category_id: categoryId,
    excerpt,
    content_json: contentJson,
    content_html: contentHtml,
    featured_image_id: featuredImage?.id || null,
    article_type: articleType,
    is_featured: isFeatured,
    is_breaking: isBreaking,
    tag_ids: selectedTagIds,
    seo: {
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      canonical_url: canonicalUrl || null,
      og_image_url: ogImageUrl || null,
    },
    revision_note: editorRevisionNote || undefined,
    is_autosave: isAutosave,
  });

  const handleSave = useCallback(
    async (isAutosave = false) => {
      if (!title.trim() || !categoryId || readOnly) return;
      setSaving(true);
      if (!isAutosave) {
        setError("");
        setNotice("");
      }
      try {
        if (!id) {
          const res = await cmsFetch<ArticleDetail>("/cms/articles", {
            method: "POST",
            body: JSON.stringify(buildPayload(false)),
          });
          dirtyRef.current = false;
          setId(res.data.id);
          setSlug(res.data.slug);
          setSavedLabel(`Tersimpan pukul ${new Date().toLocaleTimeString("id-ID")}`);
          router.replace(`/cms/artikel/${res.data.id}`);
        } else {
          const res = await cmsFetch<ArticleDetail>(`/cms/articles/${id}`, {
            method: "PUT",
            body: JSON.stringify(buildPayload(isAutosave)),
          });
          dirtyRef.current = false;
          setSlug(res.data.slug);
          setEditorRevisionNote("");
          setSavedLabel(
            `${isAutosave ? "Tersimpan otomatis" : "Tersimpan"} pukul ${new Date().toLocaleTimeString("id-ID")}`
          );
        }
      } catch (err) {
        if (!isAutosave) {
          setError(err instanceof Error ? err.message : "Gagal menyimpan artikel.");
        }
      } finally {
        setSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, title, slug, categoryId, excerpt, contentHtml, contentJson, featuredImage, articleType, isFeatured, isBreaking, selectedTagIds, metaTitle, metaDescription, canonicalUrl, ogImageUrl, editorRevisionNote, readOnly]
  );

  // Autosave every 30s (US-C-01 AC2)
  useEffect(() => {
    if (!id || readOnly) return;
    const timer = setInterval(() => {
      if (dirtyRef.current) {
        handleSave(true);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [id, readOnly, handleSave]);

  const handleTransition = async (
    targetStatus: ArticleDetail["status"],
    extra: { note?: string; published_at?: string } = {}
  ) => {
    if (!id) {
      setError("Simpan draf terlebih dahulu sebelum mengubah status.");
      return;
    }
    setError("");
    setNotice("");
    try {
      if (dirtyRef.current && !readOnly) {
        await handleSave(false);
      }
      const res = await cmsFetch<ArticleDetail>(`/cms/articles/${id}/transition`, {
        method: "POST",
        body: JSON.stringify({ target_status: targetStatus, ...extra }),
      });
      setStatus(res.data.status);
      setReviewNote(res.data.review_note || null);
      setShowReturnBox(false);
      setShowScheduleBox(false);
      setReturnNoteInput("");
      setNotice(`Status artikel berhasil diubah menjadi ${STATUS_LABEL[res.data.status]?.label || res.data.status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status.");
    }
  };

  const handlePreview = async () => {
    if (!id) return;
    try {
      const res = await cmsFetch<{ preview_url: string }>(`/cms/articles/${id}/preview-token`, {
        method: "POST",
      });
      window.open(res.data.preview_url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat tautan pratinjau.");
    }
  };

  const handleRestoreRevision = async (revId: number) => {
    if (!id || !confirm("Pulihkan isi artikel ke versi revisi ini?")) return;
    try {
      await cmsFetch(`/cms/articles/${id}/revisions/${revId}/restore`, { method: "POST" });
      await loadArticle(id);
      setTab("editor");
      setNotice("Versi revisi berhasil dipulihkan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulihkan revisi.");
    }
  };

  const handleAddCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError("");
    try {
      const res = await cmsFetch<ArticleCorrection>(`/cms/articles/${id}/corrections`, {
        method: "POST",
        body: JSON.stringify({ type: corrType, note: corrNote }),
      });
      setCorrections((prev) => [res.data, ...prev]);
      setCorrNote("");
      setNotice("Catatan ralat/pembaruan ditambahkan dan tampil publik.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah ralat.");
    }
  };

  const handleDeleteCorrection = async (corrId: number) => {
    if (!id || !confirm("Hapus catatan ralat ini? Aksi ini tercatat di log aktivitas.")) return;
    try {
      await cmsFetch(`/cms/articles/${id}/corrections/${corrId}`, { method: "DELETE" });
      setCorrections((prev) => prev.filter((c) => c.id !== corrId));
      setNotice("Catatan ralat dihapus.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus ralat.");
    }
  };

  const canSubmitReview =
    status === "draft" &&
    title.trim().length > 0 &&
    excerpt.trim().length > 0 &&
    categoryId > 0 &&
    !!featuredImage &&
    featuredImage.credit_source.trim().length > 0 &&
    featuredImage.alt_text.trim().length > 0;

  if (loading) {
    return <div className="text-sm text-[var(--ink-muted)]">Memuat artikel...</div>;
  }

  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <h1 className="font-editorial text-2xl font-bold">
            {id ? "Sunting Artikel" : "Tulis Artikel Baru"}
          </h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_LABEL[status]?.color || ""}`}>
            {STATUS_LABEL[status]?.label || status}
          </span>
          {savedLabel && <span className="text-xs text-[var(--ink-muted)]">{savedLabel}</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {id && (
            <button
              type="button"
              onClick={handlePreview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--paper)]"
            >
              <Eye className="w-3.5 h-3.5" /> Pratinjau
            </button>
          )}
          {!readOnly && (
            <button
              type="button"
              disabled={saving || !title.trim()}
              onClick={() => handleSave(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? "Menyimpan..." : "Simpan"}
            </button>
          )}
          {status === "draft" && id && (
            <button
              type="button"
              disabled={!canSubmitReview}
              title={
                canSubmitReview
                  ? "Ajukan artikel ke antrean review editor"
                  : "Lengkapi judul, excerpt, kategori, dan gambar utama (beserta kredit & alt text)"
              }
              onClick={() => handleTransition("in_review")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-amber-600 text-white disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" /> Ajukan ke Editor
            </button>
          )}
          {isEditor && status === "in_review" && (
            <>
              <button
                type="button"
                onClick={() => setShowReturnBox(!showReturnBox)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-amber-500 text-amber-700 dark:text-amber-300"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Kembalikan ke Penulis
              </button>
              <button
                type="button"
                onClick={() => setShowScheduleBox(!showScheduleBox)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-blue-600 text-white"
              >
                <Clock className="w-3.5 h-3.5" /> Jadwalkan
              </button>
              <button
                type="button"
                onClick={() => handleTransition("published")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Terbitkan
              </button>
            </>
          )}
          {isEditor && status === "scheduled" && (
            <button
              type="button"
              onClick={() => handleTransition("in_review", { note: "Jadwal dibatalkan" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-blue-500 text-blue-700"
            >
              Batalkan Jadwal
            </button>
          )}
          {isEditor && status === "published" && (
            <button
              type="button"
              onClick={() => handleTransition("archived")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-[var(--border)] hover:bg-[var(--paper)]"
            >
              <Archive className="w-3.5 h-3.5" /> Arsipkan
            </button>
          )}
          {isAdmin && status === "archived" && (
            <button
              type="button"
              onClick={() => handleTransition("published", { note: "Diterbitkan kembali oleh admin" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 text-white"
            >
              Terbitkan Kembali
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}
      {notice && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{notice}</div>
      )}
      {reviewNote && status === "draft" && (
        <div className="p-3 rounded bg-amber-50 border border-amber-300 text-amber-900 text-sm">
          <strong>Catatan Editor:</strong> {reviewNote}
        </div>
      )}
      {readOnly && (
        <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-900 text-sm">
          Artikel sedang berstatus <strong>{STATUS_LABEL[status]?.label}</strong>. Jurnalis tidak dapat menyunting isi sampai editor mengembalikannya ke draf.
        </div>
      )}

      {/* Return to writer box */}
      {showReturnBox && (
        <div className="p-4 rounded-md border border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 space-y-2">
          <label className="block text-xs font-semibold">Catatan pengembalian ke penulis (wajib):</label>
          <textarea
            rows={2}
            value={returnNoteInput}
            onChange={(e) => setReturnNoteInput(e.target.value)}
            placeholder="Jelaskan bagian yang perlu diverifikasi atau diperbaiki..."
            className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--surface)]"
          />
          <button
            type="button"
            disabled={!returnNoteInput.trim()}
            onClick={() => handleTransition("draft", { note: returnNoteInput })}
            className="px-4 py-1.5 text-xs font-semibold rounded bg-amber-600 text-white disabled:opacity-40"
          >
            Konfirmasi Kembalikan ke Draf
          </button>
        </div>
      )}

      {/* Schedule box */}
      {showScheduleBox && (
        <div className="p-4 rounded-md border border-blue-300 bg-blue-50/70 dark:bg-blue-950/30 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Waktu Tayang (WIB)</label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="px-3 py-1.5 text-sm rounded border border-[var(--border)] bg-[var(--surface)]"
            />
          </div>
          <button
            type="button"
            disabled={!scheduleDate}
            onClick={() => handleTransition("scheduled", { published_at: new Date(scheduleDate).toISOString() })}
            className="px-4 py-2 text-xs font-semibold rounded bg-blue-600 text-white disabled:opacity-40"
          >
            Simpan Jadwal
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] text-sm">
        <button
          type="button"
          onClick={() => setTab("editor")}
          className={`px-4 py-2 font-medium border-b-2 ${tab === "editor" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--ink-muted)]"}`}
        >
          Editor
        </button>
        <button
          type="button"
          onClick={() => setTab("seo")}
          className={`px-4 py-2 font-medium border-b-2 ${tab === "seo" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--ink-muted)]"}`}
        >
          SEO &amp; Pratinjau
        </button>
        {id && (
          <button
            type="button"
            onClick={() => setTab("revisions")}
            className={`px-4 py-2 font-medium border-b-2 inline-flex items-center gap-1.5 ${tab === "revisions" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--ink-muted)]"}`}
          >
            <History className="w-3.5 h-3.5" /> Revisi
          </button>
        )}
        {id && status === "published" && (
          <button
            type="button"
            onClick={() => setTab("corrections")}
            className={`px-4 py-2 font-medium border-b-2 inline-flex items-center gap-1.5 ${tab === "corrections" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--ink-muted)]"}`}
          >
            <AlertCircle className="w-3.5 h-3.5" /> Ralat ({corrections.length})
          </button>
        )}
      </div>

      {tab === "editor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main writing column */}
          <div className="lg:col-span-8 space-y-4">
            <div>
              <input
                type="text"
                disabled={readOnly}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  dirtyRef.current = true;
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="Judul artikel yang jelas, akurat, dan informatif..."
                className="w-full px-3 py-2.5 font-editorial text-2xl font-bold rounded-md border border-[var(--border)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)]"
              />
              <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--ink-muted)]">
                <span>Slug: /baca/</span>
                <input
                  type="text"
                  disabled={readOnly}
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                    dirtyRef.current = true;
                  }}
                  className="flex-1 px-2 py-0.5 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Excerpt / Lead Berita <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={2}
                disabled={readOnly}
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  dirtyRef.current = true;
                }}
                placeholder="Ringkasan singkat 1–2 kalimat yang merangkum inti tulisan..."
                className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--surface)]"
              />
            </div>

            <RichTextEditor
              key={id ? `ed-${id}-${initialHtml.length}` : "ed-new"}
              initialHtml={initialHtml}
              readOnly={readOnly}
              onChange={({ html, json, text }) => {
                setContentHtml(html);
                setContentJson(json);
                const w = text.trim().split(/\s+/).filter(Boolean).length;
                setWordCount(w);
                dirtyRef.current = true;
              }}
            />

            <div className="flex items-center justify-between text-xs text-[var(--ink-muted)]">
              <span>
                {wordCount} kata · Estimasi waktu baca {readingTime} menit
              </span>
              {isEditor && !readOnly && (
                <input
                  type="text"
                  value={editorRevisionNote}
                  onChange={(e) => setEditorRevisionNote(e.target.value)}
                  placeholder="Catatan revisi opsional saat menyimpan..."
                  className="w-72 px-2.5 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                />
              )}
            </div>
          </div>

          {/* Right Metadata Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Pengaturan Artikel
              </h2>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Kategori <span className="text-red-600">*</span>
                </label>
                <select
                  disabled={readOnly}
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(Number(e.target.value));
                    dirtyRef.current = true;
                  }}
                  className="w-full px-2.5 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent ? `${c.parent.name} — ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Jenis Tulisan</label>
                <select
                  disabled={readOnly}
                  value={articleType}
                  onChange={(e) => {
                    setArticleType(e.target.value as ArticleDetail["article_type"]);
                    dirtyRef.current = true;
                  }}
                  className="w-full px-2.5 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
                >
                  <option value="news">Berita</option>
                  <option value="in_depth">Liputan Mendalam</option>
                  <option value="feature">Feature</option>
                  <option value="opinion">Opini Publik</option>
                </select>
              </div>

              {isEditor && (
                <div className="pt-2 space-y-2 border-t border-[var(--border)]">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => {
                        setIsFeatured(e.target.checked);
                        dirtyRef.current = true;
                      }}
                    />
                    Tampilkan di Blok Headline Beranda
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={isBreaking}
                      onChange={(e) => {
                        setIsBreaking(e.target.checked);
                        dirtyRef.current = true;
                      }}
                    />
                    Tampilkan di Strip Berita Terkini (24 jam)
                  </label>
                </div>
              )}
            </div>

            {/* Featured Image */}
            <div className="p-4 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                  Gambar Utama <span className="text-red-600">*</span>
                </h2>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => setMediaModalOpen(true)}
                    className="text-xs font-semibold text-[var(--accent)] hover:underline"
                  >
                    {featuredImage ? "Ganti" : "Pilih / Unggah"}
                  </button>
                )}
              </div>
              {featuredImage ? (
                <div className="space-y-1.5">
                  <img
                    src={featuredImage.file_url}
                    alt={featuredImage.alt_text}
                    className="w-full aspect-[16/9] object-cover rounded border border-[var(--border)]"
                  />
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    <strong>Alt:</strong> {featuredImage.alt_text}
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    <strong>Kredit:</strong> {featuredImage.credit_source}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setMediaModalOpen(true)}
                  className="w-full py-8 rounded border-2 border-dashed border-[var(--border)] flex flex-col items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:border-[var(--accent)]"
                >
                  <ImageIcon className="w-5 h-5" />
                  Pilih gambar utama (wajib untuk review)
                </button>
              )}
            </div>

            {/* Tags */}
            <div className="p-4 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Tag / Topik
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        setSelectedTagIds((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((tid) => tid !== tag.id)
                            : [...prev, tag.id]
                        );
                        dirtyRef.current = true;
                      }}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        active
                          ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                          : "border-[var(--border)] hover:border-[var(--ink-muted)]"
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "seo" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-4">
            <h2 className="font-editorial text-lg font-bold">Metadata SEO</h2>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="font-semibold">Meta Title (maks. 60 karakter)</label>
                <span className={(metaTitle || title).length > 60 ? "text-red-600 font-semibold" : "text-[var(--ink-muted)]"}>
                  {(metaTitle || title).length}/60
                </span>
              </div>
              <input
                disabled={readOnly}
                maxLength={70}
                value={metaTitle}
                onChange={(e) => {
                  setMetaTitle(e.target.value);
                  dirtyRef.current = true;
                }}
                placeholder={title || "Default mengikuti judul artikel"}
                className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="font-semibold">Meta Description (maks. 160 karakter)</label>
                <span className={(metaDescription || excerpt).length > 160 ? "text-red-600 font-semibold" : "text-[var(--ink-muted)]"}>
                  {(metaDescription || excerpt).length}/160
                </span>
              </div>
              <textarea
                disabled={readOnly}
                maxLength={170}
                rows={3}
                value={metaDescription}
                onChange={(e) => {
                  setMetaDescription(e.target.value);
                  dirtyRef.current = true;
                }}
                placeholder={excerpt || "Default mengikuti excerpt artikel"}
                className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Canonical URL (Opsional)</label>
              <input
                disabled={readOnly}
                value={canonicalUrl}
                onChange={(e) => {
                  setCanonicalUrl(e.target.value);
                  dirtyRef.current = true;
                }}
                placeholder={`https://pelitakata.id/baca/${slug || "judul-artikel"}`}
                className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">OG Image URL (Opsional)</label>
              <input
                disabled={readOnly}
                value={ogImageUrl}
                onChange={(e) => {
                  setOgImageUrl(e.target.value);
                  dirtyRef.current = true;
                }}
                placeholder={featuredImage?.file_url || "Default mengikuti gambar utama"}
                className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
              />
            </div>
          </div>

          {/* Google & WhatsApp Preview (FR-C-10) */}
          <div className="space-y-4">
            <div className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Pratinjau Hasil Pencarian Google
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400">
                pelitakata.id › baca › {slug || "judul-artikel"}
              </div>
              <div className="text-lg font-medium text-blue-700 dark:text-blue-400 leading-snug">
                {metaTitle || title || "Judul Artikel Pelita Kata"}
              </div>
              <p className="text-sm text-[var(--ink-muted)] line-clamp-2">
                {metaDescription || excerpt || "Ringkasan artikel akan tampil di sini pada hasil pencarian Google."}
              </p>
            </div>

            <div className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Pratinjau Tautan WhatsApp / Media Sosial
              </div>
              <div className="rounded border border-[var(--border)] overflow-hidden bg-[var(--paper)]">
                {(ogImageUrl || featuredImage?.file_url) && (
                  <img
                    src={ogImageUrl || featuredImage?.file_url}
                    alt="OG Preview"
                    className="w-full aspect-[16/9] object-cover"
                  />
                )}
                <div className="p-3 space-y-1">
                  <div className="text-[11px] uppercase text-[var(--ink-muted)]">pelitakata.id</div>
                  <div className="font-semibold text-sm">{metaTitle || title || "Judul Artikel"}</div>
                  <div className="text-xs text-[var(--ink-muted)] line-clamp-2">
                    {metaDescription || excerpt || "Deskripsi singkat artikel"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "revisions" && (
        <div className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <h2 className="font-editorial text-lg font-bold">Riwayat Revisi &amp; Perbandingan (Diff)</h2>
          {diffRevision && (
            <div className="p-4 rounded-md border border-[var(--border)] bg-[var(--paper)] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">
                  Membandingkan Revisi #{diffRevision.id} ({formatDateWIB(diffRevision.created_at)}) → Versi Saat Ini
                </span>
                <button
                  type="button"
                  onClick={() => setDiffRevision(null)}
                  className="text-[var(--accent)] hover:underline"
                >
                  Tutup Diff
                </button>
              </div>
              <div className="text-sm leading-relaxed flex flex-wrap gap-1">
                {computeWordDiff(
                  stripTags(diffRevision.content_snapshot?.html || ""),
                  stripTags(contentHtml || "")
                ).map((part, idx) => (
                  <span
                    key={idx}
                    className={
                      part.type === "add"
                        ? "bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100 px-0.5 rounded"
                        : part.type === "del"
                        ? "bg-red-200/80 dark:bg-red-900/60 text-red-950 dark:text-red-100 line-through px-0.5 rounded"
                        : ""
                    }
                  >
                    {part.word}
                  </span>
                ))}
              </div>
            </div>
          )}
          {revisions.length === 0 ? (
            <p className="text-sm text-[var(--ink-muted)]">Belum ada riwayat revisi.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {revisions.map((rev) => (
                <div key={rev.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold">{rev.title_snapshot}</div>
                    <div className="text-xs text-[var(--ink-muted)]">
                      {formatDateWIB(rev.created_at)} · oleh {rev.editor?.name || "Redaksi"} · Status:{" "}
                      <strong>{rev.status_snapshot}</strong>
                      {rev.revision_note ? ` · "${rev.revision_note}"` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDiffRevision(rev)}
                      className="px-3 py-1 text-xs font-medium rounded border border-[var(--border)] hover:bg-[var(--paper)]"
                    >
                      Bandingkan Diff
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleRestoreRevision(rev.id)}
                        className="px-3 py-1 text-xs font-medium rounded border border-[var(--border)] hover:bg-[var(--paper)]"
                      >
                        Pulihkan Versi Ini
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "corrections" && (
        <div className="space-y-5">
          {isEditor && (
            <form
              onSubmit={handleAddCorrection}
              className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-3"
            >
              <h2 className="font-editorial text-lg font-bold">Tambah Catatan Ralat / Pembaruan</h2>
              <p className="text-xs text-[var(--ink-muted)]">
                Catatan ini akan tampil secara transparan di bagian atas artikel publik dan memperbarui <code>&lt;lastmod&gt;</code> sitemap.
              </p>
              <div className="flex gap-3">
                <select
                  value={corrType}
                  onChange={(e) => setCorrType(e.target.value as "correction" | "update")}
                  className="px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
                >
                  <option value="correction">Ralat (Koreksi Fakta/Nama/Angka)</option>
                  <option value="update">Pembaruan (Perkembangan Informasi)</option>
                </select>
              </div>
              <textarea
                rows={3}
                required
                minLength={5}
                value={corrNote}
                onChange={(e) => setCorrNote(e.target.value)}
                placeholder="Tuliskan penjelasan ralat atau pembaruan secara jelas dan transparan..."
                className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded bg-[var(--accent)] text-white"
              >
                Terbitkan Catatan Ralat
              </button>
            </form>
          )}

          <div className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-3">
            <h3 className="font-semibold text-sm">Daftar Catatan Ralat &amp; Pembaruan</h3>
            {corrections.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">Belum ada catatan ralat pada artikel ini.</p>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {corrections.map((c) => (
                  <div key={c.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        [{c.type === "correction" ? "Ralat" : "Pembaruan"}] · {formatDateWIB(c.created_at)} ·{" "}
                        {c.creator?.name || c.created_by || user?.name}
                      </div>
                      <p className="text-sm">{c.note}</p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCorrection(c.id)}
                        title="Hapus ralat (khusus admin, tercatat di log)"
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <MediaPickerModal
        open={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={(media) => {
          setFeaturedImage(media);
          dirtyRef.current = true;
        }}
      />
    </div>
  );
}

