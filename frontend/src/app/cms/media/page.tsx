"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, Trash2, Search } from "lucide-react";
import { cmsFetch } from "@/lib/api";
import type { MediaItem } from "@/lib/types";

export default function CmsMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [q, setQ] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [creditSource, setCreditSource] = useState("");
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await cmsFetch<MediaItem[]>(`/cms/media?per_page=40${q ? `&q=${encodeURIComponent(q)}` : ""}`);
    setItems(res.data || []);
  }, [q]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError("");
    setMsg("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("credit_source", creditSource);
      fd.append("alt_text", altText);
      if (caption) fd.append("caption", caption);

      await cmsFetch<MediaItem>("/cms/media", { method: "POST", body: fd });
      setFile(null);
      setCreditSource("");
      setAltText("");
      setCaption("");
      setMsg("Gambar berhasil diunggah dan dikonversi ke WebP (beserta varian ukuran).");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah media.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus media ini?")) return;
    setError("");
    setMsg("");
    try {
      await cmsFetch(`/cms/media/${id}`, { method: "DELETE" });
      setMsg("Media dihapus.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus media.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-editorial text-2xl font-bold">Pustaka Media</h1>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
      {msg && <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{msg}</div>}

      <form
        onSubmit={handleUpload}
        className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="md:col-span-2">
          <h2 className="text-sm font-bold mb-1">Unggah Gambar Baru (Otomatis WebP &amp; Hapus EXIF)</h2>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm border border-[var(--border)] rounded p-2 bg-[var(--paper)]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Kredit Sumber *</label>
          <input
            required
            value={creditSource}
            onChange={(e) => setCreditSource(e.target.value)}
            placeholder="Pelita Kata / Nama Fotografer"
            className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Alt Text *</label>
          <input
            required
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Deskripsi singkat untuk aksesibilitas"
            className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
          />
        </div>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption peristiwa (opsional tapi direkomendasikan)"
            className="flex-1 px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
          />
          <button
            type="submit"
            disabled={uploading || !file}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded bg-[var(--accent)] text-white disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> {uploading ? "Memproses..." : "Unggah"}
          </button>
        </div>
      </form>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari kredit, caption, atau alt text..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--surface)]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col">
            <img src={item.file_url} alt={item.alt_text} className="w-full aspect-[16/10] object-cover bg-zinc-200" />
            <div className="p-3 text-xs space-y-1 flex-1">
              <div className="font-semibold line-clamp-1">{item.alt_text}</div>
              <div className="text-[var(--ink-muted)] line-clamp-1">Kredit: {item.credit_source}</div>
              <div className="text-[11px] text-[var(--ink-muted)]">
                {item.width}×{item.height}px · {item.file_type}
              </div>
            </div>
            <div className="px-3 py-2 border-t border-[var(--border)] flex justify-between items-center text-xs">
              <a href={item.file_url} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">
                Buka
              </a>
              <button type="button" onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline inline-flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

