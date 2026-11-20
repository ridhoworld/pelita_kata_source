import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">404</p>
        <h1 className="font-editorial text-3xl font-bold">Halaman Tidak Ditemukan</h1>
        <p className="text-sm text-[var(--ink-muted)]">
          Artikel atau halaman yang Anda cari mungkin telah dipindahkan, diarsipkan, atau tautannya keliru.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium rounded bg-[var(--accent)] text-white"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/cari"
            className="px-4 py-2 text-sm font-medium rounded border border-[var(--border)] hover:bg-[var(--surface)]"
          >
            Cari Artikel
          </Link>
        </div>
      </div>
    </div>
  );
}

