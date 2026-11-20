const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export interface ApiEnvelope<T> {
  data: T;
  meta: Record<string, unknown>;
  errors: { message: string; details?: Record<string, string[]> } | null;
}

export async function publicFetch<T>(
  path: string,
  options?: { revalidate?: number; cache?: RequestCache }
): Promise<ApiEnvelope<T> | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: options?.cache === "no-store" ? undefined : { revalidate: options?.revalidate ?? 60 },
      cache: options?.cache,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as ApiEnvelope<T>;
  } catch {
    return null;
  }
}

export function getCmsToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pelitakata_token");
}

export function setCmsToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("pelitakata_token", token);
  } else {
    localStorage.removeItem("pelitakata_token");
  }
}

export async function cmsFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  const token = getCmsToken();
  const isFormData = init.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  const json = await res.json().catch(() => ({
    data: null,
    meta: {},
    errors: { message: `HTTP ${res.status}` },
  }));

  if (!res.ok) {
    const msg =
      json?.errors?.message ||
      json?.message ||
      `Permintaan gagal (${res.status})`;
    const err = new Error(msg) as Error & { status?: number; details?: unknown };
    err.status = res.status;
    err.details = json?.errors?.details || json?.errors;
    throw err;
  }

  return json as ApiEnvelope<T>;
}

export function formatDateWIB(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return (
      new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(d) + " WIB"
    );
  } catch {
    return iso;
  }
}

export function formatShortDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const ARTICLE_TYPE_LABEL: Record<string, string> = {
  news: "Berita",
  opinion: "Opini",
  feature: "Feature",
  in_depth: "Liputan Mendalam",
};

export const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft: { label: "Draf", color: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200" },
  in_review: { label: "Dalam Review", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  scheduled: { label: "Terjadwal", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  published: { label: "Terbit", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  archived: { label: "Diarsipkan", color: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300" },
};

export function buildSrcSet(variants?: Record<string, string> | null): string | undefined {
  if (!variants) return undefined;
  const entries = Object.entries(variants)
    .filter(([w, url]) => /^\d+$/.test(w) && typeof url === "string" && url.length > 0)
    .sort((a, b) => Number(a[0]) - Number(b[0]));
  if (entries.length === 0) return undefined;
  return entries.map(([w, url]) => `${url} ${w}w`).join(", ");
}

