import { useState, useEffect, useCallback, useRef } from "react";
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
function platformIcon(source_url?: string) {
  if (!source_url) return null;
  if (source_url.includes("youtube.com") || source_url.includes("youtu.be")) {
    return <Play size={14} className="text-red-500" />;
  }
  if (source_url.includes("github.com")) {
    return <GitBranch size={14} className="text-text" />;
  }
  return <Globe size={14} className="text-muted" />;
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
export function LibraryPage() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  const [tag, setTag] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LibraryEntry | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage) || 1;
  const handleRefetch = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);
  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);
  // Listen for keyboard shortcut to focus search
  useEffect(() => {
    const handler = () => searchInputRef.current?.focus();
    window.addEventListener("focus-library-search", handler);
    return () => window.removeEventListener("focus-library-search", handler);
  }, []);
  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, section, tag]);
  return (
    <div className="space-y-4">
      <PullIndicator distance={pullDistance} />
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            ref={searchInputRef}
            className="pl-9"
            placeholder="Search library... (press / to focus)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="secondary"
            onClick={() => {
              if (entries.length > 0) {
                const random = entries[Math.floor(Math.random() * entries.length)];
                setSelectedEntry(random);
              }
            }}
            disabled={entries.length === 0}
          >
            <Shuffle size={14} className="mr-1" />
            Random
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Link2 size={14} className="mr-1" />
            Save Link
          </Button>
        </div>
      </div>
      {/* Section filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSection("")}
          className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
            section === ""
              ? "border-accent bg-accent text-white"
              : "border-border bg-card text-muted hover:text-text"
          }`}
        >
          All
        </button>
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
              section === s
                ? "border-accent bg-accent text-white"
                : "border-border bg-card text-muted hover:text-text"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setTag("")}
            className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
              tag === "" ? "bg-accent text-white" : "bg-surface text-muted hover:text-text"
            }`}
          >
            Any tag
          </button>
          {allTags.slice(0, 20).map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`rounded-md px-2 py-0.5 text-xs transition-colors ${
                tag === t ? "bg-accent text-white" : "bg-surface text-muted hover:text-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {/* Entries grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="h-4 w-3/4 rounded shimmer" />
              <div className="h-3 w-1/2 rounded shimmer" />
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full shimmer" />
                <div className="h-6 w-12 rounded-full shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
            <BookOpen size={28} className="text-accent/60" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">Your library is empty</h3>
          <p className="mb-4 text-sm text-muted">Start building your knowledge base by saving your first link or note.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-accent px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            Save Your First Link
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className={`cursor-pointer transition-shadow hover:shadow-md border-l-4 ${sectionAccentColor(entry.section)}`}
              onClick={() => setSelectedEntry(entry)}
            >
              {/* YouTube thumbnail */}
              {(() => {
                const thumb = youtubeThumbnail(entry.source_url);
                if (!thumb) return null;
                return (
                  <div className="-mx-4 -mt-4 mb-3 overflow-hidden rounded-t-xl">
                    <img
                      src={thumb}
                      alt=""
                      className="h-32 w-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                );
              })()}
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold line-clamp-2">{entry.title}</h4>
                {entry.source_url && (
                  <a
                    href={entry.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 rounded p-1 text-muted hover:text-accent transition-colors"
                    title="Open link"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {platformIcon(entry.source_url)}
                <Badge variant="default">{entry.section}</Badge>
                <Badge variant="accent">{entry.status}</Badge>
              </div>
              {entry.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.tags.slice(0, 4).map((t) => (
                    <span key={t} className="inline-flex items-center gap-0.5 text-xs text-muted">
                      <Tag size={10} />
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 flex items-center gap-1 text-xs text-muted">
                <Clock size={10} />
                {entry.captured_at}
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
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
