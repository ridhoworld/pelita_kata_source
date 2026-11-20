"use client";

import { useEffect, useState } from "react";
import { cmsFetch } from "@/lib/api";
import type { StaticPage } from "@/lib/types";

export default function CmsPagesPage() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [editing, setEditing] = useState<StaticPage | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    cmsFetch<StaticPage[]>("/cms/pages").then((r) => setPages(r.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (p: StaticPage) => {
    setEditing(p);
    setTitle(p.title);
    setSlug(p.slug);
    setContentHtml(p.content_html);
    setMsg("");
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      if (editing) {
        await cmsFetch(`/cms/pages/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ title, slug, content_html: contentHtml, is_published: true }),
        });
        setMsg("Halaman statis diperbarui.");
      } else {
        await cmsFetch("/cms/pages", {
          method: "POST",
          body: JSON.stringify({ title, slug, content_html: contentHtml, is_published: true }),
        });
        setMsg("Halaman statis baru dibuat.");
      }
      setEditing(null);
      setTitle("");
      setSlug("");
      setContentHtml("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan halaman.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-editorial text-2xl font-bold">Halaman Statis &amp; Kebijakan</h1>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
      {msg && <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 rounded-md border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => startEdit(p)}
              className={`w-full text-left p-4 hover:bg-[var(--paper)] ${editing?.id === p.id ? "bg-[var(--paper)]" : ""}`}
            >
              <div className="font-semibold text-sm">{p.title}</div>
              <div className="text-xs text-[var(--ink-muted)]">/{p.slug}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="lg:col-span-8 p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-lg font-bold">
              {editing ? `Sunting: ${editing.title}` : "Buat Halaman Baru"}
            </h2>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setTitle("");
                  setSlug("");
                  setContentHtml("");
                }}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                + Halaman Baru
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Judul *</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="pedoman-media-siber" className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Konten HTML *</label>
            <textarea required rows={10} value={contentHtml} onChange={(e) => setContentHtml(e.target.value)} className="w-full px-3 py-2 text-sm font-mono rounded border border-[var(--border)] bg-[var(--paper)]" />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-semibold rounded bg-[var(--accent)] text-white">
            Simpan Halaman
          </button>
        </form>
      </div>
    </div>
  );
}

