import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  GitBranch,
  Calendar,
  CalendarDays,
  BarChart3,
  Target,
  Terminal,
  Bell,
  Send,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "graph", label: "Graph", icon: GitBranch },
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "planning", label: "Planning", icon: Target },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "commands", label: "Commands", icon: Terminal },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "cmd", label: "Send Command", icon: Send },
];

interface NavTabsProps {
  active: string;
  onChange: (id: string) => void;
}

export function NavTabs({ active, onChange }: NavTabsProps) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              active === tab.id
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-muted hover:text-text"
            )}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
