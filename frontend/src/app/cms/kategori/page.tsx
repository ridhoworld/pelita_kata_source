"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { cmsFetch } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function CmsCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    cmsFetch<Category[]>("/cms/categories").then((r) => setCategories(r.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await cmsFetch("/cms/categories", {
        method: "POST",
        body: JSON.stringify({
          name,
          parent_id: parentId ? Number(parentId) : null,
          description: description || null,
          sort_order: Number(sortOrder) || 0,
        }),
      });
      setName("");
      setParentId("");
      setDescription("");
      setMsg("Kategori berhasil ditambahkan.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah kategori.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus kategori ini?")) return;
    setError("");
    setMsg("");
    try {
      await cmsFetch(`/cms/categories/${id}`, { method: "DELETE" });
      setMsg("Kategori dihapus.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus kategori.");
    }
  };

  const rootCategories = categories.filter((c) => !c.parent_id);

  return (
    <div className="space-y-6">
      <h1 className="font-editorial text-2xl font-bold">Kelola Kategori (Maks. 2 Tingkat)</h1>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
      {msg && <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{msg}</div>}

      <form onSubmit={handleCreate} className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1">Nama Kategori *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Induk (Opsional)</label>
          <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]">
            <option value="">— Rubrik Utama —</option>
            {rootCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Deskripsi</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
        </div>
        <div className="flex gap-2">
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-20 px-2 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" title="Urutan" />
          <button type="submit" className="flex-1 px-4 py-2 text-sm font-semibold rounded bg-[var(--accent)] text-white">Tambah</button>
        </div>
      </form>

      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-[var(--border)] bg-[var(--paper)] text-xs uppercase text-[var(--ink-muted)]">
            <tr>
              <th className="p-3">Nama</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Induk</th>
              <th className="p-3">Jumlah Artikel</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-xs text-[var(--ink-muted)]">/{c.slug}</td>
                <td className="p-3 text-xs">{c.parent?.name || "—"}</td>
                <td className="p-3 text-xs">{c.articles_count ?? 0}</td>
                <td className="p-3 text-right">
                  <button type="button" onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline inline-flex items-center gap-1 text-xs">
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

