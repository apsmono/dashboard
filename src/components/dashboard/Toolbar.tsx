import { useState } from "react";
import { useThemeContext } from "@/components/layout/ThemeProvider";
import { cn } from "@/lib/utils";
import { Monitor, Sun, Moon, ChevronDown, ChevronUp } from "lucide-react";

export function Toolbar() {
  const { theme, setTheme } = useThemeContext();
  const [expanded, setExpanded] = useState(false);

  const themeButtons = [
    { id: "dark" as const, icon: Moon, label: "Dark" },
    { id: "light" as const, icon: Sun, label: "Light" },
    { id: "system" as const, icon: Monitor, label: "System" },
  ];

  const activeLabel = themeButtons.find((t) => t.id === theme)?.label ?? "Theme";

  return (
    <div className="mb-4">
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
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-card p-2">
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
    </div>
  );
}
