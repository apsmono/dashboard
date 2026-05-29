import { useState, useEffect, useCallback } from "react";
import { useOfflineCache } from "./useOfflineCache";
import {
  apiGet,
  apiPost,
  apiDelete,
  isOfflineError,
  fetchLibraryEntries,
  fetchLibraryEntry,
  fetchLibrarySections,
  fetchLibraryTags,
  fetchLinkPreview,
  checkDuplicateUrl,
  sendCommand,
  fetchGraphData,
  fetchTimeline,
  fetchTagsAnalysis,
  fetchGapsAnalysis,
  fetchActivityAnalysis,
  fetchGoals,
  fetchProjects,
  fetchFocusSuggestions,
  fetchYouTubeTranscript,
  updateLibraryEntry,
  synthesizeEntry,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  fetchHabits,
  createHabit,
  checkinHabit,
  uncheckinHabit,
  deleteHabit,
  updateGoal,
} from "@/lib/api";
import { queueMutation } from "@/lib/offline";
import type {
  DashboardStats,
  Command,
  Reminder,
  LibraryListResponse,
  LibraryEntry,
  LibraryFilters,
} from "@/types";

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export function useDashboardStats() {
  const { data, error, loading, isStale, refetch } = useOfflineCache<DashboardStats>(
    "dashboard-stats",
    () => apiGet<DashboardStats>("/api/v1/dashboard/stats"),
    []
  );

  return { data, error: isStale ? "" : error, loading, refetch, isStale };
}

// ---------------------------------------------------------------------------
// YouTube transcript
// ---------------------------------------------------------------------------

type TranscriptState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Awaited<ReturnType<typeof fetchYouTubeTranscript>> }
  | { status: "error"; message: string };

export function useYouTubeTranscript() {
  const [state, setState] = useState<TranscriptState>({ status: "idle" });

  const fetchTranscript = useCallback(async (url: string) => {
    setState({ status: "loading" });
    try {
      const data = await fetchYouTubeTranscript(url);
      setState({ status: "success", data });
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch transcript";
      setState({ status: "error", message });
      throw e;
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, fetchTranscript, reset };
}

// ---------------------------------------------------------------------------
// Update library entry
// ---------------------------------------------------------------------------

export function useUpdateLibraryEntry() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>("");

  const update = useCallback(async (id: string, body: Parameters<typeof updateLibraryEntry>[1]) => {
    setUpdating(true);
    setError("");
    try {
      const res = await updateLibraryEntry(id, body);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to update entry";
      setError(msg);
      throw e;
    } finally {
      setUpdating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUpdating(false);
    setError("");
  }, []);

  return { update, updating, error, reset };
}

// ---------------------------------------------------------------------------
// Entry synthesis (AI Q&A)
// ---------------------------------------------------------------------------

export function useEntrySynthesis() {
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const ask = useCallback(async (id: string, query: string) => {
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const res = await synthesizeEntry(id, query);
      if (res.status !== "ok") {
        throw new Error(res.reply ?? "AI synthesis failed");
      }
      setAnswer(res.answer ?? "");
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to synthesize";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAnswer("");
    setLoading(false);
    setError("");
  }, []);

  return { ask, answer, loading, error, reset };
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

export function useCommands() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommands = useCallback(async () => {
    try {
      const data = await apiGet<Command[]>("/api/v1/commands");
      setCommands(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  return { commands, loading, refetch: fetchCommands };
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

export function useReminders() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    try {
      const data = await apiGet<{ items: Reminder[] }>("/api/v1/reminders");
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReminder = useCallback(async (message: string, runAt: string) => {
    const payload = { message, run_at: runAt };
    try {
      await apiPost("/api/v1/reminders", payload);
      await fetchReminders();
    } catch (e) {
      if (isOfflineError(e)) {
        queueMutation({ endpoint: "/api/v1/reminders", method: "POST", payload });
      }
      throw e;
    }
  }, [fetchReminders]);

  const deleteReminder = useCallback(async (id: string) => {
    try {
      await apiDelete(`/api/v1/reminders/${encodeURIComponent(id)}`);
      await fetchReminders();
    } catch (e) {
      if (isOfflineError(e)) {
        queueMutation({ endpoint: `/api/v1/reminders/${encodeURIComponent(id)}`, method: "DELETE", payload: {} });
      }
      throw e;
    }
  }, [fetchReminders]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return { items, loading, createReminder, deleteReminder, refetch: fetchReminders };
}

// ---------------------------------------------------------------------------
// Library entries
// ---------------------------------------------------------------------------

export function useLibraryEntries(filters: LibraryFilters = {}) {
  const [data, setData] = useState<LibraryListResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchLibraryEntries(filters);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load library entries");
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.section, filters.tag, filters.status, filters.page, filters.per_page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

export function useLibraryEntry(id: string | null) {
  const [data, setData] = useState<LibraryEntry | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchLibraryEntry(id);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load entry");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

export function useLibrarySections() {
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchLibrarySections();
      setSections(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { sections, loading, refetch: fetchData };
}

export function useLibraryTags() {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchLibraryTags();
      setTags(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { tags, loading, refetch: fetchData };
}

// ---------------------------------------------------------------------------
// Link preview + duplicate check
// ---------------------------------------------------------------------------

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Awaited<ReturnType<typeof fetchLinkPreview>> }
  | { status: "error"; message: string };

export function useLinkPreview() {
  const [state, setState] = useState<PreviewState>({ status: "idle" });

  const fetchPreview = useCallback(async (url: string) => {
    setState({ status: "loading" });
    try {
      const data = await fetchLinkPreview(url);
      setState({ status: "success", data });
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch preview";
      setState({ status: "error", message });
      throw e;
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, fetchPreview, reset };
}

export function useDuplicateCheck() {
  const [isDuplicate, setIsDuplicate] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async (url: string) => {
    setChecking(true);
    try {
      const dup = await checkDuplicateUrl(url);
      setIsDuplicate(dup);
      return dup;
    } catch (e) {
      setIsDuplicate(null);
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsDuplicate(null);
    setChecking(false);
  }, []);

  return { isDuplicate, checking, check, reset };
}

// ---------------------------------------------------------------------------
// Save link to library
// ---------------------------------------------------------------------------

export function useSaveLink() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const save = useCallback(async (url: string, tags?: string[], status?: string, commandText?: string) => {
    setSaving(true);
    setError("");
    try {
      const text = commandText ?? (() => {
        const commandParts = [`article: ${url}`];
        if (tags && tags.length > 0) commandParts.push(`tags: ${tags.join(", ")}`);
        if (status) commandParts.push(`status: ${status}`);
        return commandParts.join("\n");
      })();
      const res = await sendCommand(text);
      if (res.status !== "ok") {
        throw new Error(res.reply ?? "Unknown error saving link");
      }
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save link";
      setError(msg);
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSaving(false);
    setError("");
  }, []);

  return { save, saving, error, reset };
}

// ---------------------------------------------------------------------------
// Graph
// ---------------------------------------------------------------------------

export function useGraphData(maxNodes?: number) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchGraphData>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchGraphData(maxNodes);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [maxNodes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function useTimeline(filters?: { section?: string; from_date?: string; to_date?: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchTimeline>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchTimeline(filters);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters?.section, filters?.from_date, filters?.to_date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export function useTagsAnalysis() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchTagsAnalysis>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchTagsAnalysis();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

export function useGapsAnalysis() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchGapsAnalysis>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchGapsAnalysis();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

export function useActivityAnalysis() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchActivityAnalysis>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchActivityAnalysis();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

// ---------------------------------------------------------------------------
// Planning
// ---------------------------------------------------------------------------

export function useGoals() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchGoals>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchGoals();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const update = useCallback(async (goalId: string, payload: Parameters<typeof updateGoal>[1]) => {
    const res = await updateGoal(goalId, payload);
    await fetchData();
    return res;
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData, update };
}

export function useProjects() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchProjects>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchProjects();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

export function useFocusSuggestions() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchFocusSuggestions>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchFocusSuggestions();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData };
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function useTasks(filters?: { status?: string; goal_id?: string; project_id?: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchTasks>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchTasks(filters);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.goal_id, filters?.project_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(async (payload: Parameters<typeof createTask>[0]) => {
    try {
      const res = await createTask(payload);
      await fetchData();
      return res;
    } catch (e) {
      if (isOfflineError(e)) {
        queueMutation({ endpoint: "/api/v1/planning/tasks", method: "POST", payload });
      }
      throw e;
    }
  }, [fetchData]);

  const update = useCallback(async (taskId: string, payload: Parameters<typeof updateTask>[1]) => {
    try {
      const res = await updateTask(taskId, payload);
      await fetchData();
      return res;
    } catch (e) {
      if (isOfflineError(e)) {
        queueMutation({ endpoint: `/api/v1/planning/tasks/${taskId}`, method: "PUT", payload });
      }
      throw e;
    }
  }, [fetchData]);

  const remove = useCallback(async (taskId: string) => {
    try {
      const res = await deleteTask(taskId);
      await fetchData();
      return res;
    } catch (e) {
      if (isOfflineError(e)) {
        queueMutation({ endpoint: `/api/v1/planning/tasks/${taskId}`, method: "DELETE", payload: {} });
      }
      throw e;
    }
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData, create, update, remove };
}

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

export function useHabits() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchHabits>> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchHabits();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(async (payload: Parameters<typeof createHabit>[0]) => {
    try {
      const res = await createHabit(payload);
      await fetchData();
      return res;
    } catch (e) {
      if (isOfflineError(e)) {
        queueMutation({ endpoint: "/api/v1/planning/habits", method: "POST", payload });
      }
      throw e;
    }
  }, [fetchData]);

  const checkin = useCallback(async (habitId: string) => {
    try {
      const res = await checkinHabit(habitId);
      await fetchData();
      return res;
    } catch (e) {
      if (isOfflineError(e)) {
        queueMutation({ endpoint: `/api/v1/planning/habits/${habitId}/checkin`, method: "PUT", payload: {} });
      }
      throw e;
    }
  }, [fetchData]);

  const uncheckin = useCallback(async (habitId: string) => {
    try {
      const res = await uncheckinHabit(habitId);
      await fetchData();
      return res;
    } catch (e) {
      if (isOfflineError(e)) {
        queueMutation({ endpoint: `/api/v1/planning/habits/${habitId}/uncheckin`, method: "PUT", payload: {} });
      }
      throw e;
    }
  }, [fetchData]);

  const remove = useCallback(async (habitId: string) => {
    try {
      const res = await deleteHabit(habitId);
      await fetchData();
      return res;
    } catch (e) {
      if (isOfflineError(e)) {
        queueMutation({ endpoint: `/api/v1/planning/habits/${habitId}`, method: "DELETE", payload: {} });
      }
      throw e;
    }
  }, [fetchData]);

  return { data, error, loading, refetch: fetchData, create, checkin, uncheckin, remove };
}
