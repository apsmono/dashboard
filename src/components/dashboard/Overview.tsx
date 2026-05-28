import { WidgetCard } from "@/components/ui/WidgetCard";
import { useDashboardStats, useGoals, useCommands } from "@/hooks/useApi";
import {
  BookOpen, User, Hash, FileText, Lightbulb, Link2, RefreshCw,
  Zap, Target, TrendingUp, Activity, Send, Sparkles
} from "lucide-react";
import { useState, useCallback } from "react";
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

export function Overview() {
  return (
    <div>
      <Greeting />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickCapture />
        <LibraryStats />
        <IntegrationHealth />
        <ActiveGoals />
        <RecentCommands />
        <AiSuggest />
      </div>
    </div>
  );
}
