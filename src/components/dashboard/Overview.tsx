import { WidgetCard } from "@/components/ui/WidgetCard";
import { useDashboardStats, useGoals, useCommands, useTimeline, useTasks } from "@/hooks/useApi";
import {
  BookOpen, User, Hash, FileText, Lightbulb, Link2, RefreshCw,
  Zap, Target, TrendingUp, Activity, Send, Sparkles, Flame, Trophy, Lock,
  GripVertical, ArrowUp, ArrowDown, Check, Circle, Plus, Trash2, Calendar
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { sendCommand } from "@/lib/api";

const statIcons: Record<string, React.ReactNode> = {
  profile: <User size={18} />,
  terms: <Hash size={18} />,
  books: <BookOpen size={18} />,
  articles: <FileText size={18} />,
  thoughts: <Lightbulb size={18} />,
  references: <Link2 size={18} />,
};

function Greeting() {
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-text">{greeting}, Arif</h2>
      <p className="text-sm text-muted">Here&apos;s your command center overview.</p>
    </div>
  );
}

function QuickCapture() {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendCommand(text.trim());
      setText("");
      setSent(true);
      setTimeout(() => setSent(false), 2000);
      // Notify other components to refresh
      window.dispatchEvent(new CustomEvent("brain-command-sent"));
    } finally {
      setSending(false);
    }
  }, [text, sending]);

  return (
    <WidgetCard title="Quick Capture" icon={<Zap size={18} />} accent>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Save link, add note, set reminder..."
          className="flex-1 rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {sending ? <Activity size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </form>
      {sent && (
        <p className="mt-2 text-xs text-success">Sent to brain</p>
      )}
    </WidgetCard>
  );
}

function LibraryStats() {
  const { data, error, loading, refetch } = useDashboardStats();

  return (
    <WidgetCard
      title="Library"
      icon={<BookOpen size={18} />}
      className="col-span-1 sm:col-span-2"
    >
      {error && (
        <div className="rounded-lg border border-danger bg-banner-error-bg px-3 py-2 text-sm text-banner-error-text">
          {error}
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        {data?.library &&
          Object.entries(data.library).map(([key, value]) => (
            <div
              key={key}
              className="flex flex-col items-center rounded-lg border border-border bg-surface p-3 text-center transition-colors hover:border-accent/30"
            >
              <div className="mb-1 text-accent">{statIcons[key]}</div>
              <div className="text-xl font-bold text-accent">{value}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted">{key}</div>
            </div>
          ))}
      </div>
      <button
        onClick={refetch}
        className="mt-3 flex items-center gap-1 text-xs text-muted hover:text-text transition-colors"
      >
        <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        Refresh
      </button>
    </WidgetCard>
  );
}

function IntegrationHealth() {
  const { data } = useDashboardStats();

  return (
    <WidgetCard title="Health" icon={<Activity size={18} />}>
      <div className="space-y-2">
        {data?.integrations &&
          Object.entries(data.integrations).map(([name, ok]) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${ok ? "bg-success" : "bg-danger"}`} />
                <span className="text-sm capitalize text-muted">{name}</span>
              </div>
              <span className={`text-xs ${ok ? "text-success" : "text-danger"}`}>
                {ok ? "OK" : "Down"}
              </span>
            </div>
          ))}
      </div>
    </WidgetCard>
  );
}

function ActiveGoals() {
  const { data } = useGoals();
  const active = data?.active ?? [];

  return (
    <WidgetCard title="Active Goals" icon={<Target size={18} />}>
      {active.length === 0 ? (
        <p className="text-sm text-muted">No active goals</p>
      ) : (
        <ul className="space-y-2">
          {active.slice(0, 5).map((g) => (
            <li key={g.id} className="flex items-center gap-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="truncate text-text">{g.title}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

function RecentCommands() {
  const { commands } = useCommands();
  const recent = commands.slice(0, 5);

  return (
    <WidgetCard title="Recent Activity" icon={<TrendingUp size={18} />}>
      {recent.length === 0 ? (
        <p className="text-sm text-muted">No recent commands</p>
      ) : (
        <ul className="space-y-2">
          {recent.map((c, i) => (
            <li key={i} className="text-sm text-muted truncate">
              <span className="text-xs text-accent mr-1">
                {new Date(c.created_at).toLocaleDateString()}
              </span>
              {c.text}
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

function AiSuggest() {
  const suggestions = [
    "Summarize my latest articles",
    "What did I capture this week?",
    "Plan my next goal",
  ];

  return (
    <WidgetCard title="AI Suggestions" icon={<Sparkles size={18} />} accent>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => window.dispatchEvent(new CustomEvent("focus-command-input", { detail: s }))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-muted transition-colors hover:border-accent hover:text-text"
          >
            {s}
          </button>
        ))}
      </div>
    </WidgetCard>
  );
}

function useStreakData() {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - 365);
  const fromStr = fromDate.toISOString().split("T")[0];
  const toStr = today.toISOString().split("T")[0];

  const { data } = useTimeline({ from_date: fromStr, to_date: toStr });
  const dailyCounts = data?.daily_counts ?? {};

  return useMemo(() => {
    const dates = Object.keys(dailyCounts).sort();
    if (dates.length === 0) return { current: 0, best: 0, total: 0 };

    // Current streak: count backwards from today
    let current = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split("T")[0];
      if ((dailyCounts[str] ?? 0) > 0) {
        current++;
      } else if (i > 0) {
        break;
      }
    }

    // Best streak
    let best = 0;
    let run = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split("T")[0];
      if ((dailyCounts[str] ?? 0) > 0) {
        run++;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }

    const total = Object.values(dailyCounts).reduce((a, b) => a + (b as number), 0);
    return { current, best, total };
  }, [dailyCounts]);
}

function StreakCounter() {
  const { current, best, total } = useStreakData();

  return (
    <WidgetCard title="Streak" icon={<Flame size={18} />} accent>
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-3xl font-bold text-accent">{current}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted">Current</div>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="text-center flex-1">
          <div className="text-3xl font-bold text-text">{best}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted">Best</div>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="text-center flex-1">
          <div className="text-3xl font-bold text-text">{total}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted">Total</div>
        </div>
      </div>
    </WidgetCard>
  );
}

function GamificationBadges() {
  const { data: stats } = useDashboardStats();
  const { current: streak } = useStreakData();
  const library = stats?.library;
  const totalEntries = library
    ? Object.values(library).reduce((a, b) => a + (b as number), 0)
    : 0;

  const badges = [
    { id: "first", label: "First Capture", desc: "Save your first entry", unlocked: totalEntries >= 1, icon: <Zap size={16} /> },
    { id: "collector", label: "Collector", desc: "10+ entries", unlocked: totalEntries >= 10, icon: <BookOpen size={16} /> },
    { id: "librarian", label: "Librarian", desc: "50+ entries", unlocked: totalEntries >= 50, icon: <BookOpen size={16} /> },
    { id: "diverse", label: "Explorer", desc: "3+ sections", unlocked: library && Object.values(library).filter((v) => (v as number) > 0).length >= 3, icon: <Target size={16} /> },
    { id: "streaker", label: "Streaker", desc: "7-day streak", unlocked: streak >= 7, icon: <Flame size={16} /> },
    { id: "master", label: "Master", desc: "100+ entries", unlocked: totalEntries >= 100, icon: <Trophy size={16} /> },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <WidgetCard title={`Achievements ${unlockedCount}/${badges.length}`} icon={<Trophy size={18} />} className="col-span-1 sm:col-span-2">
      <div className="grid grid-cols-3 gap-2">
        {badges.map((b) => (
          <div
            key={b.id}
            title={b.desc}
            className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
              b.unlocked
                ? "border-accent/30 bg-accent/5 text-accent"
                : "border-border bg-card text-muted opacity-60"
            }`}
          >
            {b.unlocked ? b.icon : <Lock size={14} />}
            <span className="text-[10px] font-medium text-center leading-tight">{b.label}</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function ActivityHeatmap() {
  // Calculate date range: last 84 days (12 weeks)
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - 83);
  const fromStr = fromDate.toISOString().split("T")[0];
  const toStr = today.toISOString().split("T")[0];

  const { data } = useTimeline({ from_date: fromStr, to_date: toStr });
  const dailyCounts = data?.daily_counts ?? {};

  // Build 84-day array with real or zero activity
  const days: { date: string; level: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = dailyCounts[dateStr] ?? 0;
    let level = 0;
    if (count >= 1) level = 1;
    if (count >= 3) level = 2;
    if (count >= 5) level = 3;
    if (count >= 8) level = 4;
    days.push({ date: dateStr, level });
  }

  const levelColors = [
    "bg-border",
    "bg-accent/20",
    "bg-accent/40",
    "bg-accent/70",
    "bg-accent",
  ];

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <WidgetCard title="Activity" icon={<Flame size={18} />} className="col-span-1 sm:col-span-2 lg:col-span-3">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Weekday labels */}
        <div className="flex flex-col gap-1 mr-2">
          {weekdayLabels.map((day) => (
            <div key={day} className="h-3 w-8 text-[10px] text-muted flex items-center">
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap grid - grouped by week */}
        {Array.from({ length: 12 }).map((_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const dayData = days[weekIndex * 7 + dayIndex];
              if (!dayData) return null;
              return (
                <div
                  key={dayIndex}
                  title={`${dayData.date}: ${["No activity", "Light", "Moderate", "High", "Intense"][dayData.level]} activity`}
                  className={`h-3 w-3 rounded-sm ${levelColors[dayData.level]} transition-colors hover:ring-1 hover:ring-accent/50`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
        <span>Less</span>
        {levelColors.map((color, i) => (
          <div key={i} className={`h-2.5 w-2.5 rounded-sm ${color}`} />
        ))}
        <span>More</span>
      </div>
    </WidgetCard>
  );
}

function TaskManager() {
  const { data, loading, create, update, remove } = useTasks({ status: "active" });
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);
  const activeTasks = data?.active ?? [];

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      await create({ title: newTask.trim(), priority: "medium" });
      setNewTask("");
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task: { id: string; status: string }) => {
    await update(task.id, { status: task.status === "active" ? "completed" : "active" });
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "high": return "bg-danger";
      case "medium": return "bg-warning";
      case "low": return "bg-success";
      default: return "bg-muted";
    }
  };

  return (
    <WidgetCard title={`Tasks ${activeTasks.length > 0 ? `(${activeTasks.length})` : ""}`} icon={<Target size={18} />} accent>
      <div className="space-y-2">
        {/* Add task */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="Add a task..."
            className="flex-1 rounded-lg border border-border bg-input-bg px-3 py-1.5 text-sm text-text outline-none focus:border-accent"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newTask.trim()}
            className="flex items-center rounded-lg bg-accent px-2.5 py-1.5 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {adding ? <Activity size={14} className="animate-spin" /> : <Plus size={14} />}
          </button>
        </div>

        {/* Task list */}
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 rounded shimmer" />
            <div className="h-8 rounded shimmer" />
          </div>
        ) : activeTasks.length === 0 ? (
          <p className="text-sm text-muted py-2">No active tasks. Add one above!</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {activeTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 rounded-lg bg-surface px-2 py-1.5 group">
                <button
                  onClick={() => toggleTask(task)}
                  className="shrink-0 text-muted hover:text-success transition-colors"
                >
                  <Circle size={16} />
                </button>
                <span className="flex-1 text-sm truncate">{task.title}</span>
                <div className={`h-2 w-2 rounded-full ${priorityColor(task.priority)}`} title={task.priority} />
                {task.due_date && (
                  <span className="text-[10px] text-muted flex items-center gap-0.5">
                    <Calendar size={10} />
                    {task.due_date}
                  </span>
                )}
                <button
                  onClick={() => remove(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger transition-all"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

const WIDGET_ORDER_KEY = "dash:widget-order";

const DEFAULT_WIDGET_ORDER = [
  "quick-capture",
  "task-manager",
  "streak",
  "library-stats",
  "achievements",
  "health",
  "goals",
  "recent",
  "ai-suggest",
  "activity",
];

const WIDGET_COMPONENTS: Record<string, React.FC> = {
  "quick-capture": QuickCapture,
  "task-manager": TaskManager,
  "streak": StreakCounter,
  "library-stats": LibraryStats,
  "achievements": GamificationBadges,
  "health": IntegrationHealth,
  "goals": ActiveGoals,
  "recent": RecentCommands,
  "ai-suggest": AiSuggest,
  "activity": ActivityHeatmap,
};

export function Overview() {
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WIDGET_ORDER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate: all default widgets must be present
        if (DEFAULT_WIDGET_ORDER.every((id) => parsed.includes(id))) {
          return parsed;
        }
      }
    } catch {
      // ignore parse errors
    }
    return DEFAULT_WIDGET_ORDER;
  });
  const [reorderMode, setReorderMode] = useState(false);

  const saveOrder = useCallback((newOrder: string[]) => {
    setOrder(newOrder);
    localStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(newOrder));
  }, []);

  const moveWidget = useCallback(
    (id: string, direction: "up" | "down") => {
      const idx = order.indexOf(id);
      if (idx === -1) return;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= order.length) return;
      const newOrder = [...order];
      [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
      saveOrder(newOrder);
    },
    [order, saveOrder]
  );

  const resetOrder = useCallback(() => {
    saveOrder(DEFAULT_WIDGET_ORDER);
  }, [saveOrder]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Greeting />
        <button
          onClick={() => setReorderMode((v) => !v)}
          className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            reorderMode
              ? "border-accent bg-accent text-white"
              : "border-border bg-card text-muted hover:text-text"
          }`}
        >
          {reorderMode ? <Check size={14} /> : <GripVertical size={14} />}
          {reorderMode ? "Done" : "Reorder"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {order.map((id, idx) => {
          const Component = WIDGET_COMPONENTS[id];
          if (!Component) return null;
          return (
            <div key={id} className="relative group">
              {reorderMode && (
                <div className="absolute -top-2 -right-2 z-10 flex items-center gap-0.5">
                  <button
                    onClick={() => moveWidget(id, "up")}
                    disabled={idx === 0}
                    className="rounded-full border border-border bg-card p-1 text-muted shadow-sm transition-colors hover:text-accent disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => moveWidget(id, "down")}
                    disabled={idx === order.length - 1}
                    className="rounded-full border border-border bg-card p-1 text-muted shadow-sm transition-colors hover:text-accent disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              )}
              <Component />
            </div>
          );
        })}
      </div>
      {reorderMode && (
        <div className="mt-4 text-center">
          <button
            onClick={resetOrder}
            className="text-xs text-muted hover:text-text transition-colors"
          >
            Reset to default order
          </button>
        </div>
      )}
    </div>
  );
}
