import { LayoutDashboard, BookOpen, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ZenView } from "./types";

const VIEWS: { id: ZenView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "core", label: "Core Dashboard", icon: LayoutDashboard },
  { id: "library", label: "Knowledge Library", icon: BookOpen },
  { id: "planner", label: "Routine Planner", icon: Target },
];

interface ZenViewSwitcherProps {
  active: ZenView;
  onChange: (view: ZenView) => void;
}

export function ZenViewSwitcher({ active, onChange }: ZenViewSwitcherProps) {
  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4"
      aria-label="Clarity Board views"
    >
      {VIEWS.map((view) => {
        const Icon = view.icon;
        const isActive = active === view.id;
        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onChange(view.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-card text-muted hover:border-accent/40 hover:text-text"
            )}
          >
            <Icon size={16} />
            <span>{view.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
