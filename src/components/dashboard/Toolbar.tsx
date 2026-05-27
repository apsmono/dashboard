import { useThemeContext } from "@/components/layout/ThemeProvider";
import { cn } from "@/lib/utils";
import { Monitor, Sun, Moon } from "lucide-react";

export function Toolbar() {
  const { theme, setTheme } = useThemeContext();

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted">Theme</span>
        {[
          { id: "dark", icon: Moon },
          { id: "light", icon: Sun },
          { id: "system", icon: Monitor },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as "dark" | "light" | "system")}
              className={cn(
                "rounded-lg border p-2 text-sm transition-colors",
                theme === t.id
                  ? "border-accent bg-surface text-text"
                  : "border-border bg-card text-muted hover:text-text"
              )}
              title={t.id}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
