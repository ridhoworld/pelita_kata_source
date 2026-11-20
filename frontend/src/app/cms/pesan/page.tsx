"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Mail, MailOpen, Trash2 } from "lucide-react";
import { cmsFetch, formatDateWIB } from "@/lib/api";
import { useCmsAuth } from "@/components/cms/CmsAuthContext";

interface ContactMessageItem {
  id: number;
  name: string;
  email: string;
  topic: "umum" | "koreksi" | "hak_jawab" | "liputan";
  message: string;
  is_read: boolean;
  created_at: string;
}

const TOPIC_BADGE: Record<string, { label: string; cls: string }> = {
  koreksi: { label: "Laporan Koreksi", cls: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  hak_jawab: { label: "Hak Jawab", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  liputan: { label: "Usulan Liputan", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  umum: { label: "Tanggapan Umum", cls: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200" },
};

export default function CmsMessagesPage() {
  const { isAdmin } = useCmsAuth();
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [topic, setTopic] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (topic) params.set("topic", topic);
    if (onlyUnread) params.set("unread", "1");
    try {
      const res = await cmsFetch<ContactMessageItem[]>(`/cms/messages?${params.toString()}`);
      setMessages(res.data || []);
      setUnreadCount(Number((res.meta as { unread_count?: number })?.unread_count || 0));
    } finally {
      setLoading(false);
    }
  }, [topic, onlyUnread]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const toggleRead = async (m: ContactMessageItem) => {
    await cmsFetch(`/cms/messages/${m.id}/read`, {
      method: "PATCH",
      body: JSON.stringify({ is_read: !m.is_read }),
    });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus pesan ini secara permanen?")) return;
    await cmsFetch(`/cms/messages/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-editorial text-2xl font-bold">Kotak Masuk Pembaca &amp; Hak Jawab</h1>
          <p className="text-xs text-[var(--ink-muted)]">
            Laporan koreksi fakta, pengajuan Hak Jawab, usulan liputan, dan tanggapan pembaca ({unreadCount} belum dibaca).
          </p>
        </div>
      </div>

      <div className="p-4 rounded-md border border-[var(--border)] bg-[var(--surface)] flex flex-wrap items-center gap-3">
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="px-3 py-1.5 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
        >
          <option value="">Semua Keperluan</option>
          <option value="koreksi">Laporan Koreksi</option>
          <option value="hak_jawab">Hak Jawab</option>
          <option value="liputan">Usulan Liputan</option>
          <option value="umum">Tanggapan Umum</option>
        </select>
        <label className="inline-flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={onlyUnread}
            onChange={(e) => setOnlyUnread(e.target.checked)}
          />
          Hanya belum dibaca
        </label>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-[var(--ink-muted)]">Memuat pesan...</p>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--ink-muted)]">
            Belum ada pesan masuk.
          </div>
        ) : (
          messages.map((m) => {
            const badge = TOPIC_BADGE[m.topic] || TOPIC_BADGE.umum;
            return (
              <div
                key={m.id}
                className={`p-5 rounded-md border bg-[var(--surface)] space-y-2.5 ${
                  m.is_read ? "border-[var(--border)] opacity-80" : "border-[var(--accent)]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {m.is_read ? (
                      <MailOpen className="w-4 h-4 text-[var(--ink-muted)]" />
                    ) : (
                      <Mail className="w-4 h-4 text-[var(--accent)]" />
                    )}
                    <span className="font-semibold text-sm">{m.name}</span>
                    <a
                      href={`mailto:${m.email}`}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      &lt;{m.email}&gt;
                    </a>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--ink-muted)]">{formatDateWIB(m.created_at)}</span>
                </div>

                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => toggleRead(m)}
                    className="inline-flex items-center gap-1 font-medium text-[var(--ink)] hover:text-[var(--accent)]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {m.is_read ? "Tandai Belum Dibaca" : "Tandai Sudah Ditangani"}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      className="inline-flex items-center gap-1 text-red-600 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

