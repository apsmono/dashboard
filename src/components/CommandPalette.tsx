import { useState, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import {
  Search,
  BookOpen,
  Target,
  TrendingUp,
  Send,
  Activity,
  Zap,
  LayoutDashboard,
  Clock,
  Hash,
  X,
  History,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { fetchLibraryEntries } from "@/lib/api";
import type { LibraryEntry } from "@/types";

const RECENT_SEARCHES_KEY = "cmdk:recent-searches";
const MAX_RECENT = 5;

function loadRecentSearches(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]) {
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
}

interface CommandPaletteProps {
  onNavigate: (tab: string) => void;
  onCommand: (text: string) => void;
}

export function CommandPalette({ onNavigate, onCommand }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);

  const fetchEntries = useCallback(async (q: string) => {
    if (!q.trim()) {
      setEntries([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchLibraryEntries({ search: q, per_page: 5 });
      setEntries(data.entries);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchEntries(search), 150);
    return () => clearTimeout(timer);
  }, [search, fetchEntries]);

  const addRecentSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecentSearches((prev) => {
      const next = [q.trim(), ...prev.filter((s) => s !== q.trim())].slice(0, MAX_RECENT);
      saveRecentSearches(next);
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const navigate = (tab: string) => {
    onNavigate(tab);
    setOpen(false);
    setSearch("");
  };

  const runCommand = (text: string) => {
    onCommand(text);
    setOpen(false);
    setSearch("");
  };

  const handleSelectEntry = (entry: LibraryEntry) => {
    addRecentSearch(entry.title);
    navigate(`library?entry=${entry.id}`);
  };

  const handleSelectSearch = (q: string) => {
    addRecentSearch(q);
    setSearch(q);
    fetchEntries(q);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 pt-[15vh] p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <Command className="[&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-border [&_[cmdk-input]]:h-12 [&_[cmdk-input]]:px-4 [&_[cmdk-input]]:text-text [&_[cmdk-input]]:bg-transparent [&_[cmdk-input]]:outline-none [&_[cmdk-group]]:px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2 [&_[cmdk-item]]:rounded-lg [&_[cmdk-item]]:cursor-pointer [&_[cmdk-item][data-selected=true]]:bg-accent/10 [&_[cmdk-item][data-selected=true]]:text-accent [&_[cmdk-list]]:max-h-[60vh] [&_[cmdk-list]]:overflow-y-auto [&_[cmdk-empty]]:py-6 [&_[cmdk-empty]]:text-center [&_[cmdk-empty]]:text-muted [&_[cmdk-separator]]:h-px [&_[cmdk-separator]]:bg-border [&_[cmdk-separator]]:my-2">
          <div className="flex items-center border-b border-border px-3">
            <Search size={16} className="text-muted shrink-0" />
            <Command.Input
              placeholder="Search entries, navigate, or run commands..."
              value={search}
              onValueChange={setSearch}
              className="flex-1 bg-transparent px-3 py-3 text-sm outline-none text-text placeholder:text-muted"
              autoFocus
            />
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted hover:text-text"
            >
              <X size={14} />
            </button>
          </div>

          <Command.List className="p-2">
            <Command.Empty>
              {loading ? "Searching..." : "No results found."}
            </Command.Empty>

            {/* Recent searches */}
            {!search.trim() && recentSearches.length > 0 && (
              <Command.Group
                heading={
                  <div className="flex items-center justify-between">
                    <span>Recent Searches</span>
                    <button
                      onClick={clearRecentSearches}
                      className="flex items-center gap-1 text-[10px] text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 size={10} />
                      Clear
                    </button>
                  </div>
                }
              >
                {recentSearches.map((q) => (
                  <Command.Item
                    key={q}
                    onSelect={() => handleSelectSearch(q)}
                  >
                    <div className="flex items-center gap-2">
                      <History size={14} className="text-muted shrink-0" />
                      <span className="text-sm truncate">{q}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {entries.length > 0 && (
              <Command.Group heading="Library Entries">
                {entries.map((entry) => (
                  <Command.Item
                    key={entry.id}
                    onSelect={() => handleSelectEntry(entry)}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-accent shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm truncate">{entry.title}</span>
                        <span className="text-xs text-muted">
                          {entry.section} · {entry.status}
                        </span>
                      </div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Separator />

            <Command.Group heading="Navigation">
              <Command.Item onSelect={() => navigate("overview")}>
                <LayoutDashboard size={14} className="mr-2 text-muted" />
                <span>Home</span>
              </Command.Item>
              <Command.Item onSelect={() => navigate("library")}>
                <BookOpen size={14} className="mr-2 text-muted" />
                <span>Library</span>
              </Command.Item>
              <Command.Item onSelect={() => navigate("planning")}>
                <Target size={14} className="mr-2 text-muted" />
                <span>Planning</span>
              </Command.Item>
              <Command.Item onSelect={() => navigate("graph")}>
                <TrendingUp size={14} className="mr-2 text-muted" />
                <span>Knowledge Graph</span>
              </Command.Item>
              <Command.Item onSelect={() => navigate("timeline")}>
                <Clock size={14} className="mr-2 text-muted" />
                <span>Timeline</span>
              </Command.Item>
              <Command.Item onSelect={() => navigate("analysis")}>
                <Activity size={14} className="mr-2 text-muted" />
                <span>Analysis</span>
              </Command.Item>
              <Command.Item onSelect={() => navigate("calendar")}>
                <CalendarDays size={14} className="mr-2 text-muted" />
                <span>Calendar</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator />

            <Command.Group heading="Quick Commands">
              <Command.Item onSelect={() => runCommand("weekly review")}>
                <Zap size={14} className="mr-2 text-accent" />
                <span>Generate Weekly Review</span>
              </Command.Item>
              <Command.Item onSelect={() => runCommand("focus suggestions")}>
                <Hash size={14} className="mr-2 text-accent" />
                <span>Get Focus Suggestions</span>
              </Command.Item>
              <Command.Item onSelect={() => navigate("cmd")}>
                <Send size={14} className="mr-2 text-accent" />
                <span>Open Command Input</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted">
            <div className="flex gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
            </div>
            <div className="flex gap-3">
              <span>Esc Close</span>
              <span className="hidden sm:inline">⌘K Open</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
