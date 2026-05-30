import { Database, MessageSquare, Zap } from "lucide-react";

interface StatusBannerProps {
  metrics?: Record<string, number>;
}

export function StatusBanner({ metrics }: StatusBannerProps) {
  const entries = metrics?.entries;
  const recentCaptures = metrics?.recent_captures;
  const commands = metrics?.commands;

  const hasMetrics =
    metrics &&
    (entries !== undefined || recentCaptures !== undefined || commands !== undefined);

  if (!hasMetrics) {
    return (
      <div className="border-b border-border bg-surface p-3 text-sm text-muted">
        Your knowledge library is growing.
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-surface p-3 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted">
        {entries !== undefined && (
          <span className="inline-flex items-center gap-1.5">
            <Database size={14} className="text-accent" />
            {entries} {entries === 1 ? "entry" : "entries"} in library
          </span>
        )}
        {recentCaptures !== undefined && recentCaptures > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Zap size={14} className="text-accent" />
            {recentCaptures} {recentCaptures === 1 ? "capture" : "captures"} today
          </span>
        )}
        {commands !== undefined && commands > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare size={14} className="text-accent" />
            {commands} {commands === 1 ? "command" : "commands"} processed
          </span>
        )}
      </div>
    </div>
  );
}
