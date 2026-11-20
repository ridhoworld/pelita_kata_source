"use client";

import Link from "next/link";
import { useState } from "react";
import { useCmsAuth } from "@/components/cms/CmsAuthContext";

export default function CmsLoginPage() {
  const { login } = useCmsAuth();
  const [email, setEmail] = useState("sari@pelitakata.id");
  const [password, setPassword] = useState("PelitaKata2026!");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk ke ruang redaksi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] px-4">
      <div className="w-full max-w-md p-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-6 shadow-sm">
        <div className="text-center space-y-1">
          <Link href="/" className="font-editorial text-3xl font-bold text-[var(--ink)]">
            Pelita Kata
          </Link>
          <p className="text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">
            Ruang Redaksi (CMS)
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold mb-1">
              Email Redaksi
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold mb-1">
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 text-sm font-semibold rounded bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Memeriksa..." : "Masuk ke CMS"}
          </button>
        </form>

        <div className="pt-4 border-t border-[var(--border)] text-xs text-[var(--ink-muted)] space-y-1">
          <div className="font-semibold text-[var(--ink)]">Akun Demo Redaksi (kata sandi: PelitaKata2026!):</div>
          <div>Admin: <code>dimas@pelitakata.id</code></div>
          <div>Editor: <code>sari@pelitakata.id</code></div>
          <div>Jurnalis: <code>budi@pelitakata.id</code></div>
        </div>
      </div>
    </div>
  );
}

