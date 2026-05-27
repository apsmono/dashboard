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
  Loader2,
  Play,
  GitBranch,
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
        <Button onClick={() => setModalOpen(true)} className="shrink-0">
          <Link2 size={14} className="mr-1" />
          Save Link
        </Button>
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
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="py-12 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-muted opacity-40" />
          <p className="text-muted">No entries found.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setSelectedEntry(entry)}
            >
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
      />

      <LinkCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleRefetch}
      />
    </div>
  );
}
