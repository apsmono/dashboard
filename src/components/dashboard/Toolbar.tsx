import { useState } from "react";
import { useThemeContext } from "@/components/layout/ThemeProvider";
import { useViewMode } from "@/hooks/useViewMode";
import { cn } from "@/lib/utils";
import { Monitor, Sun, Moon, ChevronDown, ChevronUp, Laptop, Smartphone } from "lucide-react";

export function Toolbar() {
  const { theme, setTheme } = useThemeContext();
  const { viewMode, setViewMode } = useViewMode();
  const [expanded, setExpanded] = useState(false);

  const themeButtons = [
    { id: "dark" as const, icon: Moon, label: "Dark" },
    { id: "light" as const, icon: Sun, label: "Light" },
    { id: "system" as const, icon: Monitor, label: "System" },
  ];

  const activeLabel = themeButtons.find((t) => t.id === theme)?.label ?? "Theme";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
          expanded
            ? "border-accent bg-surface text-text"
            : "border-border bg-card text-muted hover:text-text"
        )}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span className="text-xs uppercase tracking-wide">Theme: {activeLabel}</span>
      </button>

      {expanded && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
          {themeButtons.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors",
                  theme === t.id
                    ? "border-accent bg-surface text-text"
                    : "border-border bg-bg text-muted hover:text-text"
                )}
                title={t.label}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* View mode toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        <button
          onClick={() => setViewMode("desktop")}
          className={cn(
            "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors",
            viewMode === "desktop"
              ? "bg-surface text-text"
              : "text-muted hover:text-text"
          )}
          title="Desktop view"
        >
          <Laptop size={14} />
          <span className="hidden sm:inline">Desktop</span>
        </button>
        <button
          onClick={() => setViewMode("mobile")}
          className={cn(
            "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors",
            viewMode === "mobile"
              ? "bg-surface text-text"
              : "text-muted hover:text-text"
          )}
          title="Mobile view"
        >
          <Smartphone size={14} />
          <span className="hidden sm:inline">Mobile</span>
        </button>
      </div>
    </div>
  );
}
