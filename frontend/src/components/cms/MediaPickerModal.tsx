"use client";

import { useEffect, useState } from "react";
import { Upload, X, Search } from "lucide-react";
import { cmsFetch } from "@/lib/api";
import type { MediaItem } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
}

export default function MediaPickerModal({ open, onClose, onSelect }: Props) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [creditSource, setCreditSource] = useState("");
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    cmsFetch<MediaItem[]>(`/cms/media?per_page=30${q ? `&q=${encodeURIComponent(q)}` : ""}`)
      .then((res) => setItems(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, q]);

  if (!open) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("credit_source", creditSource);
      fd.append("alt_text", altText);
      if (caption) fd.append("caption", caption);

      const res = await cmsFetch<MediaItem>("/cms/media", {
        method: "POST",
        body: fd,
      });
      onSelect(res.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-editorial text-lg font-bold">Pilih Media</h2>
            <div className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setTab("library")}
                className={`px-3 py-1 rounded ${tab === "library" ? "bg-[var(--accent)] text-white" : "bg-[var(--paper)]"}`}
              >
                Pustaka
              </button>
              <button
                type="button"
                onClick={() => setTab("upload")}
                className={`px-3 py-1 rounded ${tab === "upload" ? "bg-[var(--accent)] text-white" : "bg-[var(--paper)]"}`}
              >
                Unggah Baru
              </button>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-[var(--paper)] rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {tab === "library" ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari caption, kredit sumber, atau alt text..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
                />
              </div>

              {loading ? (
                <p className="text-sm text-[var(--ink-muted)]">Memuat pustaka...</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                      className="text-left group rounded border border-[var(--border)] overflow-hidden hover:border-[var(--accent)] transition-colors"
                    >
                      <div className="aspect-[16/10] bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <img
                          src={item.file_url}
                          alt={item.alt_text}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2 text-[11px] space-y-0.5">
                        <div className="font-medium truncate">{item.alt_text}</div>
                        <div className="text-[var(--ink-muted)] truncate">{item.credit_source}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleUpload} className="max-w-lg mx-auto space-y-4">
              {error && (
                <div className="p-3 rounded bg-red-50 text-red-700 text-xs border border-red-200">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Berkas Gambar (JPG/PNG/WebP/GIF, maks 5 MB — otomatis dikonversi ke WebP)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm border border-[var(--border)] rounded p-2 bg-[var(--paper)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Kredit Sumber <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  value={creditSource}
                  onChange={(e) => setCreditSource(e.target.value)}
                  placeholder="Contoh: Pelita Kata / Budi Santoso"
                  className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Alt Text (Aksesibilitas) <span className="text-red-600">*</span>
                </label>
                <input
                  required
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Deskripsi singkat isi foto"
                  className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Caption (Direkomendasikan)</label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Keterangan peristiwa pada foto"
                  className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
                />
              </div>
              <button
                type="submit"
                disabled={uploading || !file}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded bg-[var(--accent)] text-white disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Mengonversi & Mengunggah..." : "Unggah & Gunakan"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

