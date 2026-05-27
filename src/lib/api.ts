import { getIdToken } from "./firebase";
import type { LibraryListResponse } from "@/types";

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

export async function fetchLibraryEntries(params?: {
  section?: string;
  tag?: string;
  search?: string;
  source_url?: string;
  page?: number;
  per_page?: number;
}): Promise<LibraryListResponse> {
  const qs = new URLSearchParams();
  if (params?.section) qs.set("section", params.section);
  if (params?.tag) qs.set("tag", params.tag);
  if (params?.search) qs.set("search", params.search);
  if (params?.source_url) qs.set("source_url", params.source_url);
  qs.set("page", String(params?.page ?? 1));
  qs.set("per_page", String(params?.per_page ?? 20));
  return apiGet<LibraryListResponse>(`/api/v1/library/entries?${qs.toString()}`);
}

export async function checkDuplicateUrl(url: string): Promise<boolean> {
  try {
    const data = await fetchLibraryEntries({ source_url: url, per_page: 1 });
    return data.entries.length > 0;
  } catch {
    return false;
  }
}
