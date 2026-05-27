import { getIdToken } from "./firebase";
import type { LibraryListResponse, LibraryEntry } from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE || "https://macmini.local:8000";

async function headers(): Promise<Record<string, string>> {
  const token = await getIdToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: await headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: await headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sendCommand(text: string): Promise<{ status: string; reply?: string }> {
  const res = await fetch(`${API_BASE}/command`, {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---------------------------------------------------------------------------
// Library API
// ---------------------------------------------------------------------------

export interface LibraryFilters {
  q?: string;
  section?: string;
  tag?: string;
  status?: string;
  source_url?: string;
  page?: number;
  per_page?: number;
}

export async function fetchLibraryEntries(
  opts: LibraryFilters = {}
): Promise<LibraryListResponse> {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.section) params.set("section", opts.section);
  if (opts.tag) params.set("tag", opts.tag);
  if (opts.status) params.set("status", opts.status);
  if (opts.source_url) params.set("source_url", opts.source_url);
  if (opts.page !== undefined) params.set("page", String(opts.page));
  if (opts.per_page !== undefined) params.set("per_page", String(opts.per_page));
  const query = params.toString();
  return apiGet<LibraryListResponse>(`/api/v1/library/entries${query ? `?${query}` : ""}`);
}

export async function fetchLibraryEntry(id: string): Promise<LibraryEntry> {
  return apiGet<LibraryEntry>(`/api/v1/library/entries/${encodeURIComponent(id)}`);
}

export async function fetchLibrarySections(): Promise<string[]> {
  const data = await apiGet<{ sections: string[] }>("/api/v1/library/sections");
  return data.sections;
}

export async function fetchLibraryTags(): Promise<string[]> {
  const data = await apiGet<{ tags: string[] }>("/api/v1/library/tags");
  return data.tags;
}

export interface LinkPreview {
  title: string;
  description: string;
  author: string;
  platform: string;
  source_url: string;
  extra: Record<string, unknown>;
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  // Backend enriches URLs via the article command flow.
  // We send an article command and parse the enriched reply.
  const res = await sendCommand(`article: ${url}`);
  // Fallback: if reply contains metadata JSON, parse it; otherwise return basic shape
  try {
    const parsed = JSON.parse(res.reply ?? "{}") as Partial<LinkPreview>;
    return {
      title: parsed.title ?? url,
      description: parsed.description ?? "",
      author: parsed.author ?? "",
      platform: parsed.platform ?? "generic",
      source_url: parsed.source_url ?? url,
      extra: parsed.extra ?? {},
    };
  } catch {
    return {
      title: url,
      description: res.reply ?? "",
      author: "",
      platform: "generic",
      source_url: url,
      extra: {},
    };
  }
}

export async function checkDuplicateUrl(url: string): Promise<boolean> {
  const data = await fetchLibraryEntries({ source_url: url, per_page: 1 });
  return data.total > 0;
}
