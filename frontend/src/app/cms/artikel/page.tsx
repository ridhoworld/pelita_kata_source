"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { PlusCircle, Archive, Trash2, Search } from "lucide-react";
import { cmsFetch, formatShortDate, STATUS_LABEL } from "@/lib/api";
import type { ArticleSummary, Category } from "@/lib/types";
import { useCmsAuth } from "@/components/cms/CmsAuthContext";

function ArticleListInner() {
  const searchParams = useSearchParams();
  const { isAdmin, isEditor } = useCmsAuth();

  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [categoryId, setCategoryId] = useState("");
  const [q, setQ] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ per_page: "30" });
    if (status) params.set("status", status);
    if (categoryId) params.set("category_id", categoryId);
    if (q.trim()) params.set("q", q.trim());
    if (status === "in_review") params.set("sort", "oldest_review");

    try {
      const res = await cmsFetch<ArticleSummary[]>(`/cms/articles?${params.toString()}`);
      setArticles(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [status, categoryId, q]);

  useEffect(() => {
    cmsFetch<Category[]>("/cms/categories").then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0 || !confirm(`Arsipkan ${selectedIds.length} artikel terpilih?`)) return;
    try {
      const res = await cmsFetch<{ archived_count: number }>("/cms/articles/bulk-archive", {
        method: "POST",
        body: JSON.stringify({ article_ids: selectedIds }),
      });
      setMsg(`${res.data.archived_count} artikel berhasil diarsipkan.`);
      setSelectedIds([]);
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal mengarsipkan.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus artikel ini (soft delete)?")) return;
    try {
      await cmsFetch(`/cms/articles/${id}`, { method: "DELETE" });
      setMsg("Artikel berhasil dihapus.");
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal menghapus.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-editorial text-2xl font-bold">Daftar Artikel</h1>
        <Link
          href="/cms/artikel/baru"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-[var(--accent)] text-white"
        >
          <PlusCircle className="w-4 h-4" /> Tulis Artikel Baru
        </Link>
      </div>

      {msg && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{msg}</div>
      )}

      {/* Filters */}
      <div className="p-4 rounded-md border border-[var(--border)] bg-[var(--surface)] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul artikel..."
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1.5 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draf</option>
          <option value="in_review">Dalam Review</option>
          <option value="scheduled">Terjadwal</option>
          <option value="published">Terbit</option>
          <option value="archived">Diarsipkan</option>
        </select>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-1.5 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {isEditor && selectedIds.length > 0 && (
          <button
            type="button"
            onClick={handleBulkArchive}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-[var(--border)] bg-[var(--paper)] hover:border-[var(--accent)]"
          >
            <Archive className="w-3.5 h-3.5" /> Arsipkan ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-[var(--border)] bg-[var(--paper)] text-xs uppercase text-[var(--ink-muted)]">
            <tr>
              {isEditor && <th className="p-3 w-8"></th>}
              <th className="p-3">Judul</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Penulis</th>
              <th className="p-3">Status</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[var(--ink-muted)]">
                  Memuat artikel...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[var(--ink-muted)]">
                  Tidak ada artikel ditemukan.
                </td>
              </tr>
            ) : (
              articles.map((a) => (
                <tr key={a.id} className="hover:bg-[var(--paper)]/50">
                  {isEditor && (
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(a.id)}
                        onChange={(e) =>
                          setSelectedIds((prev) =>
                            e.target.checked ? [...prev, a.id] : prev.filter((x) => x !== a.id)
                          )
                        }
                      />
                    </td>
                  )}
                  <td className="p-3 font-medium">
                    <Link href={`/cms/artikel/${a.id}`} className="hover:text-[var(--accent)]">
                      {a.title}
                    </Link>
                  </td>
                  <td className="p-3 text-xs text-[var(--ink-muted)]">{a.category?.name || "-"}</td>
                  <td className="p-3 text-xs">{a.author?.name || "-"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_LABEL[a.status]?.color || ""}`}>
                      {STATUS_LABEL[a.status]?.label || a.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-[var(--ink-muted)]">
                    {formatShortDate(a.published_at || a.updated_at)}
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <Link
                      href={`/cms/artikel/${a.id}`}
                      className="text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      Sunting
                    </Link>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        title="Hapus artikel"
                        className="text-red-600 hover:underline inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CmsArticlesPage() {
  return (
    <Suspense fallback={<div className="text-sm">Memuat daftar artikel...</div>}>
      <ArticleListInner />
    </Suspense>
  );
}

