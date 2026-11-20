"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">500</p>
        <h1 className="font-editorial text-3xl font-bold">Terjadi Gangguan Sementara</h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Maaf, halaman gagal dimuat. Silakan coba muat ulang atau kembali ke beranda.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 text-sm font-medium rounded bg-[var(--accent)] text-white"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded border border-[var(--border)]"
          >
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

