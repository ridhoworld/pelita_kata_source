"use client";

import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/articles/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    }).catch(() => {});

    return () => controller.abort();
  }, [slug]);

  return null;
}

