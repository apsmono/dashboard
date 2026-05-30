import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import {
  useLibraryEntries,
  useLibrarySections,
  useLibraryTags,
} from "@/hooks/useApi";
import { useLibraryUrlState } from "@/hooks/useLibraryUrlState";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullIndicator } from "@/components/ui/PullIndicator";
import type { LibraryEntry } from "@/types";
import { LinkCaptureModal } from "./LinkCaptureModal";
import { EntryDetailModal } from "./EntryDetailModal";
import { LibraryFilters } from "./LibraryFilters";
import { LibraryPagination } from "./LibraryPagination";
import { CardView } from "./CardView";
import { CompactListView } from "./CompactListView";
import { TableView } from "./TableView";

export function LibraryPage() {
  const [urlState, setUrlState] = useLibraryUrlState();
  const { data, loading, refetch } = useLibraryEntries({
    search: urlState.search || undefined,
    section: urlState.section || undefined,
    tag: urlState.tag || undefined,
    sort: urlState.sort !== "newest" ? urlState.sort : undefined,
    page: urlState.page,
    per_page: urlState.perPage,
  });
  const { sections } = useLibrarySections();
  const { tags: allTags } = useLibraryTags();
  const { pullDistance } = usePullToRefresh(refetch);

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / urlState.perPage) || 1;

  const [selectedEntry, setSelectedEntry] = useState<LibraryEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleRefetch = useCallback(() => {
    setUrlState({ page: 1 });
    refetch();
  }, [refetch, setUrlState]);

  const handleEntryClick = useCallback((entry: LibraryEntry) => {
    setSelectedEntry(entry);
  }, []);

  const handleDeleteEntry = useCallback((_id: string) => {
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-5">
      <PullIndicator distance={pullDistance} />

      <LibraryFilters
        urlState={urlState}
        onStateChange={setUrlState}
        sections={sections}
        tags={allTags}
        total={total}
        entries={entries}
        onSaveClick={() => setModalOpen(true)}
        onEntryClick={handleEntryClick}
      />

      {loading ? (
        urlState.view === "cards" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: urlState.perPage }).map((_, i) => (
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
        ) : urlState.view === "table" ? (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="h-10 bg-surface shimmer" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 border-b border-border/50 flex items-center px-3">
                <div className="h-4 w-full rounded shimmer" />
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
        <div className="relative overflow-hidden rounded-xl border border-border bg-card py-20 text-center">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-surface">
              <Search size={32} className="text-accent/50" />
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold">
              Knowledge base empty
            </h3>
            <p className="mb-6 text-sm text-muted max-w-sm mx-auto">
              {urlState.search || urlState.section || urlState.tag
                ? "No entries match your current filters. Try clearing them or refining your search."
                : "Your archive is waiting. Start building your neural library by saving your first link or note."}
            </p>
            {urlState.search || urlState.section || urlState.tag ? (
              <button
                onClick={() => setUrlState({ search: "", section: "", tag: "" })}
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
                Save Your First Link
              </button>
            )}
          </div>
        </div>
      ) : urlState.view === "table" ? (
        <TableView
          entries={entries}
          total={total}
          loading={loading}
          onEntryClick={handleEntryClick}
          onDeleteEntry={handleDeleteEntry}
        />
      ) : urlState.view === "cards" ? (
        <CardView entries={entries} onEntryClick={handleEntryClick} onDeleteEntry={handleDeleteEntry} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
      ) : (
        <CompactListView entries={entries} onEntryClick={handleEntryClick} />
      )}

      <LibraryPagination
        page={urlState.page}
        totalPages={totalPages}
        total={total}
        perPage={urlState.perPage}
        loading={loading}
        onPageChange={(p) => setUrlState({ page: p })}
      />

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
