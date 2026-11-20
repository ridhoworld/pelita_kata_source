import Link from "next/link";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  siteName?: string;
  tagline?: string;
}

export default function PublicFooter({
  categories,
  siteName = "Pelita Kata",
  tagline = "Jurnalisme Warga, Literasi, dan Liputan Mendalam",
}: Props) {
  return (
    <footer className="mt-16 border-t-2 border-[var(--ink)] bg-[var(--surface)] text-sm">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-3">
          <Link href="/" className="font-editorial text-2xl font-bold text-[var(--ink)]">
            {siteName}
          </Link>
          <p className="text-[var(--ink-muted)] leading-relaxed max-w-md">
            {tagline}. Publikasi independen gratis tanpa paywall, tanpa iklan mengganggu, dan tanpa pelacakan lintas situs.
          </p>
        </div>

        <div>
          <h3 className="font-semibold uppercase tracking-wider text-xs text-[var(--ink-muted)] mb-3">
            Rubrik
          </h3>
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/kategori/${cat.slug}`} className="hover:text-[var(--accent)]">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold uppercase tracking-wider text-xs text-[var(--ink-muted)] mb-3">
            Kebijakan &amp; Redaksi
          </h3>
          <ul className="space-y-2">
            <li>
              <Link href="/tentang-kami" className="hover:text-[var(--accent)]">
                Tentang Kami
              </Link>
            </li>
            <li>
              <Link href="/pedoman-media-siber" className="hover:text-[var(--accent)]">
                Pedoman Media Siber
              </Link>
            </li>
            <li>
              <Link href="/kontak" className="hover:text-[var(--accent)]">
                Kontak &amp; Hak Jawab
              </Link>
            </li>
            <li>
              <Link href="/rss.xml" className="hover:text-[var(--accent)]">
                Umpan RSS 2.0
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--ink-muted)]">
          <p>© {new Date().getFullYear()} {siteName}. Diterbitkan untuk kepentingan literasi publik.</p>
          <p>Tanpa cookie pelacak · Menghormati privasi pembaca.</p>
        </div>
      </div>
    </footer>
  );
}

