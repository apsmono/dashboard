import { useMemo } from "react";
import { useTasks, useHabits, useReminders, useTimeline } from "./useApi";

export interface CalendarEvent {
  id: string;
  type: "task" | "habit" | "reminder" | "entry";
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  status?: string;
  color: string;
  priority?: string;
}

function toDateStr(iso: string): string {
  return iso.split("T")[0];
}

function toTimeStr(iso: string): string | undefined {
  if (!iso.includes("T")) return undefined;
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date().toISOString().split("T")[0];
  return dueDate < today;
}

export function useCalendarData() {
  const { data: tasksData, loading: tasksLoading } = useTasks();
  const { data: habitsData, loading: habitsLoading } = useHabits();
  const { items: reminders, loading: remindersLoading } = useReminders();

  const today = new Date();
  const fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const toDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const { data: timelineData, loading: timelineLoading } = useTimeline({
    from_date: fromDate.toISOString().split("T")[0],
    to_date: toDate.toISOString().split("T")[0],
  });

  const loading = tasksLoading || habitsLoading || remindersLoading || timelineLoading;

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};

    const add = (date: string, event: CalendarEvent) => {
      if (!map[date]) map[date] = [];
      map[date].push(event);
    };

    // Tasks
    const allTasks = [...(tasksData?.active ?? []), ...(tasksData?.completed ?? [])];
    allTasks.forEach((task) => {
      if (!task.due_date) return;
      add(task.due_date, {
        id: `task-${task.id}`,
        type: "task",
        title: task.title,
        date: task.due_date,
        status: task.status,
        color: task.status === "completed" ? "bg-success" : isOverdue(task.due_date) ? "bg-danger" : "bg-accent",
        priority: task.priority,
      });
    });

    // Habits (from checkins array)
    habitsData?.habits.forEach((habit) => {
      habit.checkins.forEach((checkin) => {
        const date = toDateStr(checkin);
        add(date, {
          id: `habit-${habit.id}-${date}`,
          type: "habit",
          title: habit.name,
          date,
          color: "bg-success",
        });
      });
    });

    // Reminders
    reminders.forEach((reminder) => {
      const date = toDateStr(reminder.run_at);
      add(date, {
        id: `reminder-${reminder.id}`,
        type: "reminder",
        title: reminder.message,
        date,
        time: toTimeStr(reminder.run_at),
        color: "bg-warning",
      });
    });

    // Timeline entries
    timelineData?.days.forEach((day) => {
      day.entries.forEach((entry) => {
        add(entry.date, {
          id: `entry-${entry.id}`,
          type: "entry",
          title: entry.title,
          date: entry.date,
          color: "bg-muted",
        });
      });
    });

    // Sort events within each day by type then title
    Object.values(map).forEach((events) => {
      events.sort((a, b) => {
        const typeOrder = { reminder: 0, task: 1, habit: 2, entry: 3 };
        return typeOrder[a.type] - typeOrder[b.type] || a.title.localeCompare(b.title);
      });
    });

    return map;
  }, [tasksData, habitsData, reminders, timelineData]);

  return { eventsByDate, loading };
}
