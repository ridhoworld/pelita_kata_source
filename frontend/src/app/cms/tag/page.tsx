"use client";

import { useEffect, useState } from "react";
import { Trash2, GitMerge } from "lucide-react";
import { cmsFetch } from "@/lib/api";
import type { Tag } from "@/lib/types";

export default function CmsTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [name, setName] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    cmsFetch<Tag[]>("/cms/tags").then((r) => setTags(r.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await cmsFetch("/cms/tags", { method: "POST", body: JSON.stringify({ name }) });
      setName("");
      setMsg("Tag berhasil ditambahkan.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah tag.");
    }
  };

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;
    setError("");
    setMsg("");
    try {
      await cmsFetch("/cms/tags/merge", {
        method: "POST",
        body: JSON.stringify({ source_tag_id: Number(sourceId), target_tag_id: Number(targetId) }),
      });
      setSourceId("");
      setTargetId("");
      setMsg("Tag duplikat berhasil digabungkan.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menggabungkan tag.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus tag ini?")) return;
    setError("");
    setMsg("");
    try {
      await cmsFetch(`/cms/tags/${id}`, { method: "DELETE" });
      setMsg("Tag dihapus.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus tag.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-editorial text-2xl font-bold">Kelola Tag</h1>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
      {msg && <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form onSubmit={handleCreate} className="p-4 rounded-md border border-[var(--border)] bg-[var(--surface)] flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1">Tambah Tag Baru</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Kebijakan Publik" className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-semibold rounded bg-[var(--accent)] text-white">Tambah</button>
        </form>

        <form onSubmit={handleMerge} className="p-4 rounded-md border border-[var(--border)] bg-[var(--surface)] flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold mb-1">Gabungkan Tag Duplikat (Sumber)</label>
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="w-full px-2.5 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]">
              <option value="">Pilih tag sumber...</option>
              {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold mb-1">Ke Tag Tujuan</label>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full px-2.5 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]">
              <option value="">Pilih tag tujuan...</option>
              {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={!sourceId || !targetId || sourceId === targetId} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded border border-[var(--border)] hover:bg-[var(--paper)] disabled:opacity-40">
            <GitMerge className="w-4 h-4" /> Gabung
          </button>
        </form>
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-[var(--border)] bg-[var(--paper)] text-xs uppercase text-[var(--ink-muted)]">
            <tr>
              <th className="p-3">Nama</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Artikel</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {tags.map((t) => (
              <tr key={t.id}>
                <td className="p-3 font-medium">#{t.name}</td>
                <td className="p-3 text-xs text-[var(--ink-muted)]">/tag/{t.slug}</td>
                <td className="p-3 text-xs">{t.articles_count ?? 0}</td>
                <td className="p-3 text-right">
                  <button type="button" onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline inline-flex items-center gap-1 text-xs">
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

