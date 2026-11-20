"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("umum");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setFeedback("");
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setFeedback(data?.message || data?.errors?.message || "Gagal mengirim pesan.");
        return;
      }
      setStatus("sent");
      setFeedback(data?.data?.message || "Pesan Anda telah kami terima.");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setFeedback("Terjadi kesalahan jaringan. Silakan coba lagi.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 p-6 rounded-md border border-[var(--border)] bg-[var(--surface)] space-y-4"
    >
      <h2 className="font-editorial text-xl font-bold">Kirim Pesan / Koreksi / Hak Jawab</h2>

      {feedback && (
        <div
          className={`p-3 rounded text-sm ${
            status === "sent"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="c-name" className="block text-xs font-semibold mb-1">
            Nama Lengkap
          </label>
          <input
            id="c-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
          />
        </div>
        <div>
          <label htmlFor="c-email" className="block text-xs font-semibold mb-1">
            Email
          </label>
          <input
            id="c-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
          />
        </div>
      </div>

      <div>
        <label htmlFor="c-topic" className="block text-xs font-semibold mb-1">
          Keperluan
        </label>
        <select
          id="c-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
        >
          <option value="umum">Tanggapan Pembaca / Umum</option>
          <option value="koreksi">Laporan Kekeliruan Fakta / Koreksi</option>
          <option value="hak_jawab">Pengajuan Hak Jawab</option>
          <option value="liputan">Usulan Liputan Isu Lokal</option>
        </select>
      </div>

      <div>
        <label htmlFor="c-message" className="block text-xs font-semibold mb-1">
          Pesan
        </label>
        <textarea
          id="c-message"
          rows={5}
          required
          minLength={10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Sertakan tautan artikel bila mengajukan koreksi atau hak jawab..."
          className="w-full px-3 py-2 text-sm rounded border border-[var(--border)] bg-[var(--paper)]"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="px-5 py-2.5 text-sm font-semibold rounded bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
      >
        {status === "sending" ? "Mengirim..." : "Kirim ke Redaksi"}
      </button>
    </form>
  );
}

