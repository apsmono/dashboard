import { getIdToken } from "./firebase";
import { isOfflineError as _isOfflineError } from "./offline";
import type { LibraryListResponse, LibraryEntry } from "@/types";

export { _isOfflineError as isOfflineError };

const API_BASE = import.meta.env.VITE_API_BASE || "https://api.apsmono.com";

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

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: await headers(),
    body: JSON.stringify(body),
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
  sort?: string;
  order?: string;
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
  if (opts.sort) params.set("sort", opts.sort);
  if (opts.order) params.set("order", opts.order);
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

export async function fetchLibraryRecent(
  limit = 4
): Promise<{ entries: LibraryEntry[]; total: number }> {
  return apiGet<{ entries: LibraryEntry[]; total: number }>(
    `/api/v1/library/recent?limit=${limit}`
  );
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

export interface YouTubeTranscript {
  video_id: string;
  title: string;
  transcript: string;
  language: string;
  is_generated: boolean;
}

export async function fetchYouTubeTranscript(url: string): Promise<YouTubeTranscript> {
  return apiPost<YouTubeTranscript>("/api/v1/library/youtube-transcript", { url });
}

export async function updateLibraryEntry(
  id: string,
  body: {
    title?: string;
    markdown?: string;
    tags?: string[];
    status?: string;
    notes?: string;
  }
) {
  return apiPut<{ status: string; id: string }>(`/api/v1/library/entries/${encodeURIComponent(id)}`, body);
}

export async function deleteLibraryEntry(id: string): Promise<{ status: string; id: string }> {
  return apiDelete<{ status: string; id: string }>(`/api/v1/library/entries/${encodeURIComponent(id)}`);
}

// Synthesize: POST /api/v1/library/entries/{id}/synthesize — confirmed correct 2026-05-30
export async function synthesizeEntry(
  id: string,
  query: string
): Promise<{ status: string; answer?: string; sources?: string[]; reply?: string }> {
  return apiPost<{ status: string; answer?: string; sources?: string[]; reply?: string }>(
    `/api/v1/library/entries/${encodeURIComponent(id)}/synthesize`,
    { query }
  );
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

export interface GoalEntry extends PlanningEntry {
  parent_id: string | null;
  progress: number;
  children?: GoalEntry[];
}

export interface PlanningGoals {
  goals: GoalEntry[];
  tree: GoalEntry[];
  active: GoalEntry[];
  completed: GoalEntry[];
  paused: GoalEntry[];
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

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export interface Task {
  id: string;
  title: string;
  status: string;
  goal_id: string | null;
  project_id: string | null;
  priority: string;
  due_date: string | null;
  created_at: string | null;
  path: string;
}

export interface TasksResponse {
  tasks: Task[];
  active: Task[];
  completed: Task[];
  by_priority: {
    high: Task[];
    medium: Task[];
    low: Task[];
  };
}

export interface TaskCreatePayload {
  title: string;
  status?: string;
  goal_id?: string | null;
  project_id?: string | null;
  priority?: string;
  due_date?: string | null;
}

export interface TaskUpdatePayload {
  title?: string;
  status?: string;
  goal_id?: string | null;
  project_id?: string | null;
  priority?: string;
  due_date?: string | null;
}

export async function fetchTasks(params?: { status?: string; goal_id?: string; project_id?: string }): Promise<TasksResponse> {
  const qs = new URLSearchParams();
  if (params?.status) qs.append("status", params.status);
  if (params?.goal_id) qs.append("goal_id", params.goal_id);
  if (params?.project_id) qs.append("project_id", params.project_id);
  const query = qs.toString();
  return apiGet<TasksResponse>(`/api/v1/planning/tasks${query ? `?${query}` : ""}`);
}

export async function createTask(payload: TaskCreatePayload): Promise<Task & { status: string }> {
  return apiPost<Task & { status: string }>("/api/v1/planning/tasks", payload);
}

export async function updateTask(taskId: string, payload: TaskUpdatePayload): Promise<Task & { status: string }> {
  return apiPut<Task & { status: string }>(`/api/v1/planning/tasks/${taskId}`, payload);
}

export async function deleteTask(taskId: string): Promise<{ status: string; id: string }> {
  return apiDelete<{ status: string; id: string }>(`/api/v1/planning/tasks/${taskId}`);
}

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

export interface Habit {
  id: string;
  name: string;
  frequency: string;
  color: string | null;
  created_at: string | null;
  checkins: string[];
  streak: number;
  checked_today: boolean;
  path: string;
}

export interface HabitsResponse {
  habits: Habit[];
  active: Habit[];
  total_checkins: number;
  longest_streak: number;
}

export interface HabitCreatePayload {
  name: string;
  frequency?: string;
  color?: string | null;
}

export async function fetchHabits(): Promise<HabitsResponse> {
  return apiGet<HabitsResponse>("/api/v1/planning/habits");
}

export async function createHabit(payload: HabitCreatePayload): Promise<Habit & { status: string }> {
  return apiPost<Habit & { status: string }>("/api/v1/planning/habits", payload);
}

export async function checkinHabit(habitId: string): Promise<Habit & { status: string }> {
  return apiPut<Habit & { status: string }>(`/api/v1/planning/habits/${habitId}/checkin`, {});
}

export async function uncheckinHabit(habitId: string): Promise<Habit & { status: string }> {
  return apiPut<Habit & { status: string }>(`/api/v1/planning/habits/${habitId}/uncheckin`, {});
}

export async function deleteHabit(habitId: string): Promise<{ status: string; id: string }> {
  return apiDelete<{ status: string; id: string }>(`/api/v1/planning/habits/${habitId}`);
}

export async function fetchGoals(): Promise<PlanningGoals> {
  return apiGet<PlanningGoals>("/api/v1/planning/goals");
}

export interface GoalUpdatePayload {
  title?: string;
  status?: string;
  parent_id?: string | null;
  progress?: number;
}

export async function updateGoal(goalId: string, payload: GoalUpdatePayload): Promise<GoalEntry & { status: string }> {
  return apiPut<GoalEntry & { status: string }>(`/api/v1/planning/goals/${goalId}`, payload);
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

// ---------------------------------------------------------------------------
// AI Guide API
// ---------------------------------------------------------------------------

export interface GuideCommandResponse {
  status: string;
  intent?: string;
  reply?: string;
  params?: Record<string, unknown>;
}

export async function sendGuideCommand(text: string): Promise<GuideCommandResponse> {
  return apiPost<GuideCommandResponse>("/api/v1/guide/command", { text });
}

export async function fetchGuideStatus(): Promise<{ status: string; metrics: Record<string, number> }> {
  return apiGet<{ status: string; metrics: Record<string, number> }>("/api/v1/guide/status");
}

export async function parkDistraction(text: string): Promise<{ status: string; entry_id?: string; message?: string }> {
  return apiPost<{ status: string; entry_id?: string; message?: string }>("/api/v1/guide/park", { text });
}
