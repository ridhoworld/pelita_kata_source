"use client";

import { useEffect, useState } from "react";
import { cmsFetch, formatDateWIB } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";

interface LogEntry {
  id: number;
  action: string;
  subject_type: string | null;
  subject_id: number | null;
  meta: Record<string, unknown> | null;
  user?: { name: string } | null;
  created_at: string;
}

export default function CmsSettingsPage() {
  const [siteName, setSiteName] = useState("Pelita Kata");
  const [siteTagline, setSiteTagline] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    cmsFetch<SiteSettings>("/cms/settings")
      .then((res) => {
        const s = res.data || {};
        setSiteName(s.site_name || "Pelita Kata");
        setSiteTagline(s.site_tagline || "");
        setContactEmail(s.contact_email || "");
        setMetaDesc(s.meta_description || "");
      })
      .catch(() => {});

    cmsFetch<LogEntry[]>("/cms/activity-logs")
      .then((res) => setLogs(res.data || []))
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    await cmsFetch("/cms/settings", {
      method: "PUT",
      body: JSON.stringify({
        settings: {
          site_name: siteName,
          site_tagline: siteTagline,
          contact_email: contactEmail,
          meta_description: metaDesc,
        },
      }),
    });
    setMsg("Pengaturan situs berhasil disimpan.");
  };

  return (
    <div className="space-y-8">
      <h1 className="font-editorial text-2xl font-bold">Pengaturan Situs &amp; Log Aktivitas</h1>

      {msg && <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">{msg}</div>}

      <form onSubmit={handleSave} className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-4 max-w-2xl">
        <div>
          <label className="block text-xs font-semibold mb-1">Nama Situs</label>
          <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Tagline</label>
          <input value={siteTagline} onChange={(e) => setSiteTagline(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Email Kontak Redaksi</label>
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Meta Description Default</label>
          <textarea rows={3} value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]" />
        </div>
        <button type="submit" className="px-4 py-2 text-sm font-semibold rounded bg-[var(--accent)] text-white">
          Simpan Pengaturan
        </button>
      </form>

      <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] font-semibold text-sm">
          Log Aktivitas Sensitif (FR-C-13)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-[var(--border)] bg-[var(--paper)] uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="p-3">Waktu</th>
                <th className="p-3">Pengguna</th>
                <th className="p-3">Aksi</th>
                <th className="p-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="p-3 whitespace-nowrap">{formatDateWIB(l.created_at)}</td>
                  <td className="p-3 font-medium">{l.user?.name || "Sistem"}</td>
                  <td className="p-3"><code>{l.action}</code></td>
                  <td className="p-3 text-[var(--ink-muted)]">{l.meta ? JSON.stringify(l.meta) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

