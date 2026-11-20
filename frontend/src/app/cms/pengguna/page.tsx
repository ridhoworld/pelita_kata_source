"use client";

import { useEffect, useState } from "react";
import { cmsFetch } from "@/lib/api";
import type { CmsUser } from "@/lib/types";

interface RoleItem {
  id: number;
  name: string;
}

export default function CmsUsersPage() {
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(3);
  const [bio, setBio] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    Promise.all([cmsFetch<CmsUser[]>("/cms/users"), cmsFetch<RoleItem[]>("/cms/roles")])
      .then(([uRes, rRes]) => {
        setUsers(uRes.data || []);
        setRoles(rRes.data || []);
        const jRole = rRes.data?.find((r) => r.name === "journalist");
        if (jRole) setRoleId(jRole.id);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await cmsFetch("/cms/users", {
        method: "POST",
        body: JSON.stringify({ name, username, email, password, role_id: roleId, bio }),
      });
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setBio("");
      setMsg("Akun redaksi berhasil dibuat.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat akun.");
    }
  };

  const toggleActive = async (u: CmsUser) => {
    setError("");
    try {
      await cmsFetch(`/cms/users/${u.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      setMsg(`Status akun ${u.name} diperbarui.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui akun.");
    }
  };

  const changeRole = async (u: CmsUser, newRoleId: number) => {
    setError("");
    try {
      await cmsFetch(`/cms/users/${u.id}`, {
        method: "PUT",
        body: JSON.stringify({ role_id: newRoleId }),
      });
      setMsg(`Peran ${u.name} berhasil diubah.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah peran.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-editorial text-2xl font-bold">Pengguna &amp; Peran Redaksi</h1>

      {error && <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
      {msg && <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{msg}</div>}

      <form onSubmit={handleCreate} className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1">Nama Lengkap *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Username *</label>
          <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="nama-penulis" className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Email *</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Kata Sandi (min. 12 karakter) *</label>
          <input type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Peran *</label>
          <select value={roleId} onChange={(e) => setRoleId(Number(e.target.value))} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]">
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Bio Singkat</label>
          <input value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
        </div>
        <div className="md:col-span-3">
          <button type="submit" className="px-4 py-2 text-sm font-semibold rounded bg-[var(--accent)] text-white">
            Tambah Akun Redaksi
          </button>
        </div>
      </form>

      <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-[var(--border)] bg-[var(--paper)] text-xs uppercase text-[var(--ink-muted)]">
            <tr>
              <th className="p-3">Nama &amp; Email</th>
              <th className="p-3">Username</th>
              <th className="p-3">Peran</th>
              <th className="p-3">Artikel</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-[var(--ink-muted)]">{u.email}</div>
                </td>
                <td className="p-3 text-xs">@{u.username}</td>
                <td className="p-3">
                  <select
                    value={u.role?.id}
                    onChange={(e) => changeRole(u, Number(e.target.value))}
                    className="px-2 py-1 text-xs rounded border border-[var(--border)] bg-[var(--paper)]"
                  >
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </td>
                <td className="p-3 text-xs">{u.articles_count ?? 0}</td>
                <td className="p-3 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${u.is_active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                    {u.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button type="button" onClick={() => toggleActive(u)} className="text-xs font-semibold text-[var(--accent)] hover:underline">
                    {u.is_active ? "Nonaktifkan" : "Aktifkan"}
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

