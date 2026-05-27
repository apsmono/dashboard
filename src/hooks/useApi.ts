import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { DashboardStats, Command, Reminder } from "@/types";

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
