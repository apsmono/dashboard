import { useState, useEffect, useCallback } from "react";
import {
  apiGet,
  apiPost,
  apiDelete,
  fetchLibraryEntries,
  fetchLibraryEntry,
  fetchLibrarySections,
  fetchLibraryTags,
  fetchLinkPreview,
  checkDuplicateUrl,
  sendCommand,
} from "@/lib/api";
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
  const [data, setData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const stats = await apiGet<DashboardStats>("/api/v1/dashboard/stats");
      setData(stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
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
    await apiPost("/api/v1/reminders", { message, run_at: runAt });
    await fetchReminders();
  }, [fetchReminders]);

  const deleteReminder = useCallback(async (id: string) => {
    await apiDelete(`/api/v1/reminders/${encodeURIComponent(id)}`);
    await fetchReminders();
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
  }, [filters.q, filters.section, filters.tag, filters.status, filters.page, filters.per_page]);

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

  const save = useCallback(async (url: string, tags?: string[], status?: string) => {
    setSaving(true);
    setError("");
    try {
      const commandParts = [`article: ${url}`];
      if (tags && tags.length > 0) commandParts.push(`tags: ${tags.join(", ")}`);
      if (status) commandParts.push(`status: ${status}`);
      const res = await sendCommand(commandParts.join("\n"));
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

  return { save, saving, error };
}
