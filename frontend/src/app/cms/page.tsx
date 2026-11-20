"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PlusCircle, Clock, TrendingUp, ClipboardList, Activity } from "lucide-react";
import { cmsFetch, formatDateWIB, STATUS_LABEL } from "@/lib/api";

interface DashboardData {
  status_counts: Record<string, number>;
  review_queue: {
    id: number;
    title: string;
    author?: { name: string };
    category?: { name: string };
    updated_at: string;
  }[];
  scheduled_next_7d: {
    id: number;
    title: string;
    published_at: string;
    author?: { name: string };
  }[];
  popular_7d: {
    id: number;
    title: string;
    slug: string;
    views_count: number;
    views_7d: number;
  }[];
  recent_activity: {
    id: number;
    action: string;
    user?: { name: string } | null;
    created_at: string;
  }[];
}

export default function CmsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    cmsFetch<DashboardData>("/cms/dashboard")
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  if (!data) {
    return <div className="text-sm text-[var(--ink-muted)]">Memuat ringkasan dashboard...</div>;
  }

  const cards = ["draft", "in_review", "scheduled", "published", "archived"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-editorial text-2xl font-bold">Dashboard Redaksi</h1>
          <p className="text-xs text-[var(--ink-muted)]">
            Ringkasan siklus editorial, antrean review, jadwal terbit, dan performa 7 hari terakhir.
          </p>
        </div>
        <Link
          href="/cms/artikel/baru"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md bg-[var(--accent)] text-white"
        >
          <PlusCircle className="w-4 h-4" /> Tulis Artikel Baru
        </Link>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((key) => (
          <Link
            key={key}
            href={`/cms/artikel?status=${key}`}
            className="p-4 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-colors"
          >
            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_LABEL[key]?.color || ""}`}>
              {STATUS_LABEL[key]?.label || key}
            </span>
            <div className="mt-2 font-editorial text-3xl font-bold">{data.status_counts[key] ?? 0}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review Queue (oldest first) */}
        <section className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <ClipboardList className="w-4 h-4 text-amber-600" />
            Antrean Review (Terlama di Atas)
          </div>
          {data.review_queue.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)]">Tidak ada artikel menunggu review.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {data.review_queue.map((a) => (
                <Link
                  key={a.id}
                  href={`/cms/artikel/${a.id}`}
                  className="block py-2.5 hover:text-[var(--accent)]"
                >
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-[var(--ink-muted)]">
                    {a.author?.name} · {a.category?.name} · {formatDateWIB(a.updated_at)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Scheduled Next 7 Days */}
        <section className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Clock className="w-4 h-4 text-blue-600" />
            Jadwal Terbit (7 Hari ke Depan)
          </div>
          {data.scheduled_next_7d.length === 0 ? (
            <p className="text-xs text-[var(--ink-muted)]">Belum ada artikel terjadwal minggu ini.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {data.scheduled_next_7d.map((a) => (
                <Link
                  key={a.id}
                  href={`/cms/artikel/${a.id}`}
                  className="block py-2.5 hover:text-[var(--accent)]"
                >
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-[var(--ink-muted)]">
                    Tayang: {formatDateWIB(a.published_at)} · {a.author?.name}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Top 5 Popular 7d */}
        <section className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            5 Artikel Terpopuler (7 Hari Terakhir)
          </div>
          <div className="divide-y divide-[var(--border)]">
            {data.popular_7d.map((a, idx) => (
              <div key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/baca/${a.slug}`} target="_blank" className="text-sm font-medium hover:text-[var(--accent)] truncate block">
                    {idx + 1}. {a.title}
                  </Link>
                </div>
                <span className="text-xs font-semibold text-[var(--ink-muted)] shrink-0">
                  {Number(a.views_7d).toLocaleString("id-ID")} tayang
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="p-5 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            Aktivitas Terakhir
          </div>
          <div className="divide-y divide-[var(--border)] text-xs">
            {data.recent_activity.map((log) => (
              <div key={log.id} className="py-2 flex items-center justify-between gap-2">
                <span>
                  <strong>{log.user?.name || "Sistem"}</strong> · <code>{log.action}</code>
                </span>
                <span className="text-[var(--ink-muted)] shrink-0">{formatDateWIB(log.created_at)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

