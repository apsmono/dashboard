import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  BookOpen,
  ExternalLink,
  Link2,
  Search,
  Tag,
  Clock,
  ChevronLeft,
  ChevronRight,
  Globe,
  Play,
  GitBranch,
  Shuffle,
  X,
  Filter,
  LayoutGrid,
  List,
  ChevronDown,
  ArrowUpDown,
  Calendar,
  Type,
  Database,
  CornerDownLeft,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  useLibraryEntries,
  useLibrarySections,
  useLibraryTags,
} from "@/hooks/useApi";
import type { LibraryEntry } from "@/types";
import { LinkCaptureModal } from "./LinkCaptureModal";
import { EntryDetailModal } from "./EntryDetailModal";
import { PullIndicator } from "@/components/ui/PullIndicator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

/* ═══════════════════════════════════════════════
   Helper utilities
   ═══════════════════════════════════════════════ */

function platformIcon(source_url?: string) {
  if (!source_url) return null;
  if (source_url.includes("youtube.com") || source_url.includes("youtu.be")) {
    return <Play size={13} className="text-red-400" />;
  }
  if (source_url.includes("github.com")) {
    return <GitBranch size={13} className="text-text" />;
  }
  return <Globe size={13} className="text-muted" />;
}

function platformLabel(source_url?: string): string {
  if (!source_url) return "";
  if (source_url.includes("youtube.com") || source_url.includes("youtu.be")) {
    return "YouTube";
  }
  if (source_url.includes("github.com")) return "GitHub";
  try {
    const host = new URL(source_url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return "";
  }
}

function youtubeThumbnail(source_url?: string): string | null {
  if (!source_url) return null;
  let videoId: string | null = null;
  if (source_url.includes("youtube.com/watch")) {
    const url = new URL(source_url);
    videoId = url.searchParams.get("v");
  } else if (source_url.includes("youtu.be/")) {
    videoId = source_url.split("youtu.be/")[1]?.split("?")[0];
  }
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

function sectionAccentColor(section: string): string {
  const colors: Record<string, string> = {
    profile: "border-l-blue-500",
    terms: "border-l-purple-500",
    books: "border-l-amber-500",
    articles: "border-l-emerald-500",
    thoughts: "border-l-pink-500",
    references: "border-l-cyan-500",
  };
  return colors[section] || "border-l-accent";
}

function sectionAccentBg(section: string): string {
  const colors: Record<string, string> = {
    profile: "bg-blue-500/10 text-blue-400",
    terms: "bg-purple-500/10 text-purple-400",
    books: "bg-amber-500/10 text-amber-400",
    articles: "bg-emerald-500/10 text-emerald-400",
    thoughts: "bg-pink-500/10 text-pink-400",
    references: "bg-cyan-500/10 text-cyan-400",
  };
  return colors[section] || "bg-accent/10 text-accent";
}

/** Generate page numbers with ellipsis for pagination */
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("ellipsis");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push("ellipsis");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("ellipsis");
    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
    pages.push("ellipsis");
    pages.push(total);
  }
  return pages;
}

type SortMode = "newest" | "oldest" | "title_asc" | "title_desc";
type ViewMode = "cards" | "compact";

/* ═══════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════ */

export function LibraryPage() {
  /* ── State ── */
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [view, setView] = useState<ViewMode>("cards");
  const [showAllTags, setShowAllTags] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LibraryEntry | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ── Data ── */
  const { data, loading, refetch } = useLibraryEntries({
    search: search || undefined,
    section: section || undefined,
    tag: tag || undefined,
    page,
    per_page: perPage,
  });
  const { sections } = useLibrarySections();
  const { tags: allTags } = useLibraryTags();
  const { pullDistance } = usePullToRefresh(refetch);

  const entriesRaw = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage) || 1;

  /* ── Sort (client-side, current page) ── */
  const entries = useMemo(() => {
    const arr = [...entriesRaw];
    switch (sort) {
      case "newest":
        return arr.sort((a, b) => b.captured_at.localeCompare(a.captured_at));
      case "oldest":
        return arr.sort((a, b) => a.captured_at.localeCompare(b.captured_at));
      case "title_asc":
        return arr.sort((a, b) => a.title.localeCompare(b.title));
      case "title_desc":
        return arr.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return arr;
    }
  }, [entriesRaw, sort]);

  /* ── Refetch helper ── */
  const handleRefetch = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  /* ── Debounce search ── */
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  /* ── Keyboard shortcut: focus search ── */
  useEffect(() => {
    const handler = () => searchInputRef.current?.focus();
    window.addEventListener("focus-library-search", handler);
    return () => window.removeEventListener("focus-library-search", handler);
  }, []);

  /* ── Reset page when filters change ── */
  useEffect(() => {
    setPage(1);
  }, [search, section, tag, perPage]);

  /* ── Pagination numbers ── */
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  /* ── Range text ── */
  const showingStart = total === 0 ? 0 : (page - 1) * perPage + 1;
  const showingEnd = Math.min(page * perPage, total);

  /* ── Active filter count ── */
  const activeFilterCount = [search, section, tag].filter(Boolean).length;

  /* ── Clear all filters ── */
  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setSection("");
    setTag("");
  };

  /* ── Sort options ── */
  const sortOptions: { value: SortMode; label: string; icon: React.ReactNode }[] = [
    { value: "newest", label: "Newest", icon: <Calendar size={12} /> },
    { value: "oldest", label: "Oldest", icon: <Calendar size={12} /> },
    { value: "title_asc", label: "Title A–Z", icon: <Type size={12} /> },
    { value: "title_desc", label: "Title Z–A", icon: <Type size={12} /> },
  ];

  /* ═══════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════ */

  return (
    <div className="space-y-5">
      <PullIndicator distance={pullDistance} />

      {/* ── Stats bar ── */}
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2">
        <Database size={14} className="text-accent" />
        <span className="font-mono-data text-muted">
          <span className="text-text font-medium">{total.toLocaleString()}</span> entries
          {section && (
            <>
              {" "}·{" "}
              <span className="text-text">{section}</span>
            </>
          )}
          {tag && (
            <>
              {" "}·{" "}
              <span className="text-text">#{tag}</span>
            </>
          )}
          {search && (
            <>
              {" "}· matching{" "}
              <span className="text-text">"{search}"</span>
            </>
          )}
        </span>
      </div>

      {/* ── Control Panel ── */}
      <div className="space-y-3">
        {/* Row 1: Search + Actions */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              ref={searchInputRef}
              className="pl-9 pr-9 font-display"
              placeholder="Search knowledge base…  (press / to focus)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearch(searchInput);
              }}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearch(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action buttons + controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Per-page */}
            <div className="relative">
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="h-9 appearance-none rounded-lg border border-border bg-card px-3 pr-7 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent/30 hover:border-accent/40 transition-colors cursor-pointer"
              >
                <option value={12}>12 / page</option>
                <option value={24}>24 / page</option>
                <option value={48}>48 / page</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="h-9 appearance-none rounded-lg border border-border bg-card px-3 pr-7 text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-accent/30 hover:border-accent/40 transition-colors cursor-pointer"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ArrowUpDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setView("cards")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
                  view === "cards"
                    ? "bg-accent text-black font-semibold"
                    : "bg-card text-muted hover:text-text"
                }`}
                title="Card view"
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setView("compact")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors border-l border-border ${
                  view === "compact"
                    ? "bg-accent text-black font-semibold"
                    : "bg-card text-muted hover:text-text"
                }`}
                title="Compact view"
              >
                <List size={13} />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (entries.length > 0) {
                  const random = entries[Math.floor(Math.random() * entries.length)];
                  setSelectedEntry(random);
                }
              }}
              disabled={entries.length === 0}
            >
              <Shuffle size={13} className="mr-1" />
              Random
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Link2 size={13} className="mr-1" />
              Save Link
            </Button>
          </div>
        </div>

        {/* Row 2: Section filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={13} className="text-muted shrink-0" />
          <button
            onClick={() => setSection("")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              section === ""
                ? "bg-accent text-black"
                : "bg-surface text-muted hover:text-text border border-border"
            }`}
          >
            All
          </button>
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                section === s
                  ? "bg-accent text-black"
                  : "bg-surface text-muted hover:text-text border border-border"
              }`}
            >
              {s}
            </button>
          ))}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 rounded-md border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger/10 transition-colors"
            >
              <X size={11} />
              Clear filters
            </button>
          )}
        </div>

        {/* Row 3: Tag filter pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag size={11} className="text-muted shrink-0 mr-0.5" />
            <button
              onClick={() => setTag("")}
              className={`rounded-md px-2 py-0.5 text-xs transition-all ${
                tag === "" ? "bg-accent text-black font-medium" : "text-muted hover:text-text bg-surface/50"
              }`}
            >
              any
            </button>
            {(showAllTags ? allTags : allTags.slice(0, 16)).map((t) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                className={`rounded-md px-2 py-0.5 text-xs transition-all ${
                  tag === t
                    ? "bg-accent text-black font-medium"
                    : "text-muted hover:text-text bg-surface/50"
                }`}
              >
                {t}
              </button>
            ))}
            {allTags.length > 16 && (
              <button
                onClick={() => setShowAllTags((v) => !v)}
                className="rounded-md px-2 py-0.5 text-xs text-accent hover:underline"
              >
                {showAllTags ? "less" : `+${allTags.length - 16} more`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Entries ── */}
      {loading ? (
        view === "cards" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: perPage }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card overflow-hidden"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="h-2 bg-surface shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 rounded shimmer" />
                  <div className="h-3 w-1/2 rounded shimmer" />
                  <div className="flex gap-2 pt-1">
                    <div className="h-5 w-14 rounded-md shimmer" />
                    <div className="h-5 w-12 rounded-md shimmer" />
                  </div>
                  <div className="h-px bg-border/50" />
                  <div className="h-3 w-24 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
              >
                <div className="h-8 w-8 rounded-md shimmer shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded shimmer" />
                  <div className="h-3 w-1/4 rounded shimmer" />
                </div>
                <div className="h-5 w-16 rounded-md shimmer" />
              </div>
            ))}
          </div>
        )
      ) : entries.length === 0 ? (
        /* ── Empty state ── */
        <div className="relative overflow-hidden rounded-xl border border-border bg-card py-20 text-center">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-surface">
              <BookOpen size={32} className="text-accent/50" />
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold">
              Knowledge base empty
            </h3>
            <p className="mb-6 text-sm text-muted max-w-sm mx-auto">
              {search || section || tag
                ? "No entries match your current filters. Try clearing them or refining your search."
                : "Your archive is waiting. Start building your neural library by saving your first link or note."}
            </p>
            {search || section || tag ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm text-text transition-colors hover:border-accent/40"
              >
                <X size={14} />
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                <CornerDownLeft size={14} />
                Save Your First Link
              </button>
            )}
          </div>
        </div>
      ) : view === "cards" ? (
        /* ── Card view ── */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, idx) => (
            <Card
              key={entry.id}
              className={`group cursor-pointer overflow-hidden rounded-lg border-l-4 p-0 hover-glow ${sectionAccentColor(entry.section)}`}
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => setSelectedEntry(entry)}
            >
              {/* YouTube thumbnail */}
              {(() => {
                const thumb = youtubeThumbnail(entry.source_url);
                if (!thumb) return null;
                return (
                  <div className="relative overflow-hidden">
                    <img
                      src={thumb}
                      alt=""
                      className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                  </div>
                );
              })()}

              <div className="p-4 space-y-3">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display text-[15px] font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                    {entry.title}
                  </h4>
                  {entry.source_url && (
                    <a
                      href={entry.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 shrink-0 rounded-md p-1.5 text-muted opacity-0 group-hover:opacity-100 hover:text-accent hover:bg-accent/10 transition-all"
                      title="Open source"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>

                {/* Platform + Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  {entry.source_url && platformIcon(entry.source_url) && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 font-mono-data text-[11px] text-muted">
                      {platformIcon(entry.source_url)}
                      <span className="hidden sm:inline">{platformLabel(entry.source_url)}</span>
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${sectionAccentBg(entry.section)}`}>
                    {entry.section}
                  </span>
                  <Badge variant="accent" className="text-[11px]">
                    {entry.status}
                  </Badge>
                </div>

                {/* Tags row */}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {entry.tags.slice(0, 5).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-0.5 rounded-sm bg-surface/70 px-1.5 py-0.5 font-mono-data text-[10px] text-muted/80"
                      >
                        <span className="text-accent/60">#</span>
                        {t}
                      </span>
                    ))}
                    {entry.tags.length > 5 && (
                      <span className="rounded-sm bg-surface/70 px-1.5 py-0.5 font-mono-data text-[10px] text-muted/60">
                        +{entry.tags.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer: separator + date */}
                <div className="data-separator" />
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-mono-data text-[11px] text-muted/70">
                    <Clock size={11} />
                    {entry.captured_at}
                  </span>
                  <span className="font-mono-data text-[10px] text-muted/40 uppercase tracking-wider">
                    {entry.type}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* ── Compact list view ── */
        <div className="space-y-1.5">
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              className={`group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 cursor-pointer transition-all hover:border-accent/30 hover:bg-surface/50 ${sectionAccentColor(entry.section)} border-l-4`}
              style={{ animationDelay: `${idx * 30}ms` }}
              onClick={() => setSelectedEntry(entry)}
            >
              {/* Platform icon */}
              <div className="shrink-0 text-muted">
                {platformIcon(entry.source_url) || <BookOpen size={14} />}
              </div>

              {/* Title */}
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-medium group-hover:text-accent transition-colors">
                  {entry.title}
                </h4>
              </div>

              {/* Meta: section + status */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${sectionAccentBg(entry.section)}`}>
                  {entry.section}
                </span>
                <Badge variant="accent" className="text-[11px]">
                  {entry.status}
                </Badge>
              </div>

              {/* Tags (desktop only) */}
              <div className="hidden lg:flex items-center gap-1 shrink-0 max-w-[160px]">
                {entry.tags.slice(0, 2).map((t) => (
                  <span key={t} className="rounded-sm bg-surface px-1.5 py-0.5 font-mono-data text-[10px] text-muted truncate max-w-[70px]">
                    #{t}
                  </span>
                ))}
                {entry.tags.length > 2 && (
                  <span className="text-[10px] text-muted/50">+{entry.tags.length - 2}</span>
                )}
              </div>

              {/* Date */}
              <span className="hidden md:inline font-mono-data text-[11px] text-muted/60 shrink-0 w-20 text-right">
                {entry.captured_at}
              </span>

              {/* External link */}
              {entry.source_url && (
                <a
                  href={entry.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 rounded p-1 text-muted opacity-0 group-hover:opacity-100 hover:text-accent transition-all"
                  title="Open source"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 pt-4">
          {/* Info text */}
          <span className="font-mono-data text-xs text-muted/70">
            Showing{" "}
            <span className="text-text">{showingStart}</span>
            {"–"}
            <span className="text-text">{showingEnd}</span>
            {" "}of{" "}
            <span className="text-text">{total.toLocaleString()}</span>
            {" "}entries
          </span>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            {/* First */}
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1 || loading}
              className="hidden sm:flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card text-xs text-muted hover:text-text hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="First page"
            >
              <ChevronLeft size={13} />
              <ChevronLeft size={13} className="-ml-2" />
            </button>

            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card text-muted hover:text-text hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft size={15} />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1 px-1">
              {pageNumbers.map((p, i) =>
                p === "ellipsis" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted/50">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    disabled={loading}
                    className={`flex items-center justify-center h-8 min-w-[32px] rounded-md px-2 text-xs font-medium transition-all ${
                      page === p
                        ? "bg-accent text-black"
                        : "border border-border bg-card text-muted hover:text-text hover:border-accent/30"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card text-muted hover:text-text hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight size={15} />
            </button>

            {/* Last */}
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || loading}
              className="hidden sm:flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card text-xs text-muted hover:text-text hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Last page"
            >
              <ChevronRight size={13} />
              <ChevronRight size={13} className="-ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <EntryDetailModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onUpdated={handleRefetch}
      />
      <LinkCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleRefetch}
      />
    </div>
  );
}
