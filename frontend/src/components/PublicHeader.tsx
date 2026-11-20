"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Moon, Search, Sun, Menu, X, Rss } from "lucide-react";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  siteName?: string;
  tagline?: string;
}

const FONT_SIZES = [
  { label: "A-", value: "1rem" },
  { label: "A", value: "1.125rem" },
  { label: "A+", value: "1.3rem" },
];

export default function PublicHeader({
  categories,
  siteName = "Pelita Kata",
  tagline = "Jurnalisme Warga, Literasi, dan Liputan Mendalam",
}: Props) {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [fontIdx, setFontIdx] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const savedFs = localStorage.getItem("pk_font_size");
    const found = FONT_SIZES.findIndex((f) => f.value === savedFs);
    if (found >= 0) setFontIdx(found);
    setTodayLabel(
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(new Date())
    );
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("pk_theme", next ? "dark" : "light");
  };

  const cycleFont = () => {
    const nextIdx = (fontIdx + 1) % FONT_SIZES.length;
    setFontIdx(nextIdx);
    const val = FONT_SIZES[nextIdx].value;
    document.documentElement.style.setProperty("--reading-size", val);
    localStorage.setItem("pk_font_size", val);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 3) return;
    setSearchOpen(false);
    router.push(`/cari?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-40">
      {/* Top utility strip */}
      <div className="border-b border-[var(--border)] bg-[var(--paper)]">
        <div className="max-w-6xl mx-auto px-4 h-9 flex items-center justify-between text-xs text-[var(--ink-muted)]">
          <div className="flex items-center gap-3">
            <span>{todayLabel || "Edisi Hari Ini"}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Gratis · Tanpa Paywall · Tanpa Iklan Mengganggu</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cycleFont}
              title="Ubah ukuran huruf bacaan"
              aria-label="Ubah ukuran huruf bacaan"
              className="px-2 py-0.5 rounded border border-[var(--border)] hover:bg-[var(--surface)] font-medium text-[var(--ink)]"
            >
              {FONT_SIZES[fontIdx].label}
            </button>
            <button
              type="button"
              onClick={toggleDark}
              title={dark ? "Mode terang" : "Mode gelap"}
              aria-label={dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              className="p-1 rounded border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--ink)]"
            >
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <Link
              href="/rss.xml"
              title="Umpan RSS"
              aria-label="Umpan RSS"
              className="p-1 rounded border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--ink)] hidden sm:inline-flex"
            >
              <Rss className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/cms"
              className="ml-1 text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors"
            >
              Redaksi
            </Link>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <button
          type="button"
          className="md:hidden p-2 -ml-2 text-[var(--ink)]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Buka menu navigasi"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex-1 md:flex-none text-center md:text-left">
          <Link href="/" className="inline-block">
            <span className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
              {siteName}
            </span>
          </Link>
          <p className="text-xs text-[var(--ink-muted)] hidden sm:block">{tagline}</p>
        </div>

        {/* Desktop Nav */}
        <nav aria-label="Rubrik utama" className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-[var(--accent)] transition-colors">
            Beranda
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="hover:text-[var(--accent)] transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Search toggle */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Cari artikel"
            className="p-2 rounded-full hover:bg-[var(--paper)] text-[var(--ink)]"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--paper)]">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari isu lokal, literasi, opini... (minimal 3 karakter)"
              className="flex-1 px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
              autoFocus
            />
            <button
              type="submit"
              disabled={query.trim().length < 3}
              className="px-4 py-2 text-sm font-medium rounded bg-[var(--accent)] text-white disabled:opacity-50"
            >
              Cari
            </button>
          </form>
        </div>
      )}

      {/* Mobile Nav Drawer */}
      {menuOpen && (
        <nav
          aria-label="Navigasi seluler"
          className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-2 text-sm"
        >
          <Link href="/" onClick={() => setMenuOpen(false)} className="block py-1.5 font-medium">
            Beranda
          </Link>
          {categories.map((cat) => (
            <div key={cat.id}>
              <Link
                href={`/kategori/${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                className="block py-1.5 font-medium"
              >
                {cat.name}
              </Link>
              {cat.children && cat.children.length > 0 && (
                <div className="pl-4 space-y-1">
                  {cat.children.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/kategori/${ch.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="block py-1 text-[var(--ink-muted)]"
                    >
                      {ch.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}

