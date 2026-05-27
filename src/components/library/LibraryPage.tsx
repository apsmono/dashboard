import { useEffect, useState } from "react";
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
import { fetchLibraryEntries } from "@/lib/api";
import type { LibraryEntry } from "@/types";
import { LinkCaptureModal } from "./LinkCaptureModal";

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
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LibraryEntry | null>(null);

  const loadEntries = async (p = page) => {
    setLoading(true);
    try {
      const data = await fetchLibraryEntries({
        section: section || undefined,
        search: search || undefined,
        page: p,
        per_page: perPage,
      });
      setEntries(data.entries);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load library entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const data = await fetch("/api/v1/library/sections", {
        headers: { "Content-Type": "application/json" },
      }).then((r) => r.json());
      setSections(data.sections || []);
    } catch (err) {
      console.error("Failed to load sections:", err);
    }
  };

  useEffect(() => {
    loadEntries(1);
    loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  useEffect(() => {
    const timeout = setTimeout(() => loadEntries(1), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            className="pl-9"
            placeholder="Search library..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            onClick={() => {
              const p = Math.max(1, page - 1);
              setPage(p);
              loadEntries(p);
            }}
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
            onClick={() => {
              const p = Math.min(totalPages, page + 1);
              setPage(p);
              loadEntries(p);
            }}
            disabled={page >= totalPages || loading}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* Entry detail modal */}
      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedEntry(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{selectedEntry.title}</h2>
              <button
                onClick={() => setSelectedEntry(null)}
                className="shrink-0 rounded-lg p-1 text-muted hover:text-text hover:bg-surface transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {platformIcon(selectedEntry.source_url)}
              <Badge>{selectedEntry.section}</Badge>
              <Badge variant="accent">{selectedEntry.status}</Badge>
              <Badge variant="success">{selectedEntry.type}</Badge>
            </div>

            {selectedEntry.source_url && (
              <a
                href={selectedEntry.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                <ExternalLink size={14} />
                {selectedEntry.source_url}
              </a>
            )}

            {selectedEntry.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1">
                {selectedEntry.tags.map((t) => (
                  <Badge key={t} variant="default">
                    {t}
                  </Badge>
                ))}
              </div>
            )}

            <div className="text-xs text-muted mb-2">
              Captured: {selectedEntry.captured_at} · Path: {selectedEntry.path}
            </div>

            {selectedEntry.markdown && (
              <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                <pre className="whitespace-pre-wrap text-sm text-text font-mono">
                  {selectedEntry.markdown}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <LinkCaptureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadEntries(1)}
      />
    </div>
  );
}
