import { getIdToken } from "./firebase";
import type { LibraryListResponse, LibraryEntry } from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE || "https://macmini.local:8000";

if (API_BASE.includes("macmini.local") && !window.location.hostname.includes("local")) {
  console.warn("[Dashboard] API_BASE points to macmini.local which is not reachable from the public internet.");
}

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
  search?: string;
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
  if (opts.search) params.set("search", opts.search);
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

// ---------------------------------------------------------------------------
// Graph API
// ---------------------------------------------------------------------------

export interface GraphData {
  nodes: { id: string; label: string; section: string; status: string; color: string; size: number }[];
  edges: { source: string; target: string; type: string; weight: number; tags?: string[]; section?: string }[];
}

export async function fetchGraphData(maxNodes?: number): Promise<GraphData> {
  const qs = maxNodes ? `?max_nodes=${maxNodes}` : "";
  return apiGet<GraphData>(`/api/v1/library/graph${qs}`);
}

// ---------------------------------------------------------------------------
// Timeline API
// ---------------------------------------------------------------------------

export interface TimelineDay {
  date: string;
  entries: { id: string; title: string; section: string; status: string; date: string; datetime: string }[];
}

export interface TimelineData {
  days: TimelineDay[];
  total: number;
  daily_counts: Record<string, number>;
}

export async function fetchTimeline(params?: { section?: string; from_date?: string; to_date?: string }): Promise<TimelineData> {
  const qs = new URLSearchParams();
  if (params?.section) qs.set("section", params.section);
  if (params?.from_date) qs.set("from_date", params.from_date);
  if (params?.to_date) qs.set("to_date", params.to_date);
  const query = qs.toString();
  return apiGet<TimelineData>(`/api/v1/library/timeline${query ? `?${query}` : ""}`);
}

// ---------------------------------------------------------------------------
// Analysis API
// ---------------------------------------------------------------------------

export interface TagsAnalysis {
  frequencies: Record<string, number>;
  trending: string[];
  orphan_tags: string[];
  co_occurrence: [string, string, number][];
}

export interface GapsAnalysis {
  empty_sections: string[];
  stale_entries: { id: string; title: string; section: string; days_since_update: number }[];
  orphan_entries: { id: string; title: string; section: string }[];
  section_counts: Record<string, number>;
}

export interface ActivityAnalysis {
  daily_counts: Record<string, number>;
  section_growth: Record<string, number>;
  capture_velocity: string;
  total_entries: number;
}

export async function fetchTagsAnalysis(): Promise<TagsAnalysis> {
  return apiGet<TagsAnalysis>("/api/v1/analysis/tags");
}

export async function fetchGapsAnalysis(): Promise<GapsAnalysis> {
  return apiGet<GapsAnalysis>("/api/v1/analysis/gaps");
}

export async function fetchActivityAnalysis(): Promise<ActivityAnalysis> {
  return apiGet<ActivityAnalysis>("/api/v1/analysis/activity");
}

export async function synthesizeAnalysis(query: string, entryIds?: string[]) {
  return apiPost<{ status: string; synthesis?: string; sources?: string[]; reply?: string }>(
    "/api/v1/analysis/synthesize",
    { query, entry_ids: entryIds ?? [] }
  );
}

// ---------------------------------------------------------------------------
// Planning API
// ---------------------------------------------------------------------------

export interface PlanningEntry {
  id: string;
  title: string;
  status: string;
  path: string;
  captured_at: string | null;
  preview: string;
}

export interface PlanningGoals {
  goals: PlanningEntry[];
  active: PlanningEntry[];
  completed: PlanningEntry[];
  paused: PlanningEntry[];
}

export interface PlanningProjects {
  projects: PlanningEntry[];
  active: PlanningEntry[];
  completed: PlanningEntry[];
}

export interface WeeklyReview {
  status: string;
  review: string;
  wins: string[];
  gaps: string[];
  next_focus: string;
  recent_count: number;
}

export interface FocusSuggestion {
  status: string;
  active_goals_count: number;
  active_goals: string[];
  recent_sections: Record<string, number>;
  suggestions: string[];
}

export async function fetchGoals(): Promise<PlanningGoals> {
  return apiGet<PlanningGoals>("/api/v1/planning/goals");
}

export async function fetchProjects(): Promise<PlanningProjects> {
  return apiGet<PlanningProjects>("/api/v1/planning/projects");
}

export async function fetchReviews(): Promise<{ reviews: PlanningEntry[] }> {
  return apiGet<{ reviews: PlanningEntry[] }>("/api/v1/planning/reviews");
}

export async function generateWeeklyReview(): Promise<WeeklyReview> {
  return apiPost<WeeklyReview>("/api/v1/planning/review", {});
}

export async function fetchFocusSuggestions(): Promise<FocusSuggestion> {
  return apiGet<FocusSuggestion>("/api/v1/planning/focus");
}
