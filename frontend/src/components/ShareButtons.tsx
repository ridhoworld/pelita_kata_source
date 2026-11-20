"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

interface Props {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: Props) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // cancelled
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Bagikan artikel">
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] mr-1">
        Bagikan:
      </span>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 text-xs font-medium rounded border border-[var(--border)] hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
      >
        WhatsApp
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 text-xs font-medium rounded border border-[var(--border)] hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-colors"
      >
        X
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 text-xs font-medium rounded border border-[var(--border)] hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
      >
        Facebook
      </a>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--border)] hover:bg-[var(--paper)] transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Tersalin" : "Salin Tautan"}
      </button>
      {canNativeShare && (
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[var(--border)] hover:bg-[var(--paper)] transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Lainnya
        </button>
      )}
    </div>
  );
}

