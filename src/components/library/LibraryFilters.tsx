import { useState, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  Shuffle,
  X,
  ChevronDown,
  ArrowUpDown,
  LayoutGrid,
  List,
  Calendar,
  Type,
  Database,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { LibraryUrlState } from "@/hooks/useLibraryUrlState";
import type { LibraryEntry } from "@/types";
import type { SortMode } from "./libraryHelpers";

interface LibraryFiltersProps {
  urlState: LibraryUrlState;
  onStateChange: (patch: Partial<LibraryUrlState>) => void;
  sections: string[];
  tags: string[];
  total: number;
  entries: LibraryEntry[];
  onSaveClick: () => void;
  onEntryClick: (entry: LibraryEntry) => void;
}

const sortOptions: { value: SortMode; label: string; icon: React.ReactNode }[] = [
  { value: "newest", label: "Newest", icon: <Calendar size={12} /> },
  { value: "oldest", label: "Oldest", icon: <Calendar size={12} /> },
  { value: "title_asc", label: "Title A–Z", icon: <Type size={12} /> },
  { value: "title_desc", label: "Title Z–A", icon: <Type size={12} /> },
];

export function LibraryFilters({
  urlState,
  onStateChange,
  sections,
  tags,
  total,
  entries,
  onSaveClick,
  onEntryClick,
}: LibraryFiltersProps) {
  const [searchInput, setSearchInput] = useState(urlState.search);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  /* Sync searchInput from urlState when cleared externally */
  useEffect(() => {
    if (urlState.search === "" && searchInput !== "") {
      setSearchInput("");
    }
  }, [urlState.search]);

  /* Debounce search */
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== urlState.search) {
        onStateChange({ search: searchInput });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  /* Keyboard shortcut: focus search */
  useEffect(() => {
    const handler = () => searchInputRef.current?.focus();
    window.addEventListener("focus-library-search", handler);
    return () => window.removeEventListener("focus-library-search", handler);
  }, []);

  const activeFilterCount = [urlState.search, urlState.section, urlState.tag].filter(Boolean).length;

  const clearFilters = () => {
    setSearchInput("");
    onStateChange({ search: "", section: "", tag: "" });
  };

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/50 px-3 py-2">
        <Database size={14} className="text-accent" />
        <span className="font-mono-data text-muted">
          <span className="text-text font-medium">{total.toLocaleString()}</span> entries
          {urlState.section && (
            <>
              {" "}&middot;{" "}
              <span className="text-text">{urlState.section}</span>
            </>
          )}
          {urlState.tag && (
            <>
              {" "}&middot;{" "}
              <span className="text-text">#{urlState.tag}</span>
            </>
          )}
          {urlState.search && (
            <>
              {" "}&middot; matching{" "}
              <span className="text-text">&ldquo;{urlState.search}&rdquo;</span>
            </>
          )}
        </span>
      </div>

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
              if (e.key === "Enter") onStateChange({ search: searchInput });
            }}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); onStateChange({ search: "" }); }}
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
              value={urlState.perPage}
              onChange={(e) => onStateChange({ perPage: Number(e.target.value) })}
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
              value={urlState.sort}
              onChange={(e) => onStateChange({ sort: e.target.value })}
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
              onClick={() => onStateChange({ view: "cards" })}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${
                urlState.view === "cards"
                  ? "bg-accent text-black font-semibold"
                  : "bg-card text-muted hover:text-text"
              }`}
              title="Card view"
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => onStateChange({ view: "compact" })}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors border-l border-border ${
                urlState.view === "compact"
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
                onEntryClick(random);
              }
            }}
            disabled={entries.length === 0}
          >
            <Shuffle size={13} className="mr-1" />
            Random
          </Button>
          <Button size="sm" onClick={onSaveClick}>
            <Link2 size={13} className="mr-1" />
            Save Link
          </Button>
        </div>
      </div>

      {/* Filter button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterModalOpen(true)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilterCount > 0
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border bg-card text-muted hover:text-text hover:border-accent/40"
          }`}
        >
          <Filter size={13} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 rounded-full bg-accent text-black text-[10px] font-semibold w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 rounded-md border border-danger/30 px-2 py-1 text-xs text-danger hover:bg-danger/10 transition-colors"
          >
            <X size={11} />
            Clear
          </button>
        )}
      </div>

      {/* Filter modal */}
      {filterModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setFilterModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold text-text">Filters</h3>
              <button
                onClick={() => setFilterModalOpen(false)}
                className="text-muted hover:text-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sections */}
            <div className="mb-5">
              <h4 className="text-xs font-medium text-muted mb-2">Section</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onStateChange({ section: "" })}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    urlState.section === ""
                      ? "bg-accent text-black"
                      : "bg-surface text-muted hover:text-text border border-border"
                  }`}
                >
                  All
                </button>
                {sections.map((s) => (
                  <button
                    key={s}
                    onClick={() => onStateChange({ section: s })}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                      urlState.section === s
                        ? "bg-accent text-black"
                        : "bg-surface text-muted hover:text-text border border-border"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-muted mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => onStateChange({ tag: "" })}
                    className={`rounded-md px-2 py-0.5 text-xs transition-all ${
                      urlState.tag === "" ? "bg-accent text-black font-medium" : "text-muted hover:text-text bg-surface/50"
                    }`}
                  >
                    any
                  </button>
                  {(showAllTags ? tags : tags.slice(0, 24)).map((t) => (
                    <button
                      key={t}
                      onClick={() => onStateChange({ tag: t })}
                      className={`rounded-md px-2 py-0.5 text-xs transition-all ${
                        urlState.tag === t
                          ? "bg-accent text-black font-medium"
                          : "text-muted hover:text-text bg-surface/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  {tags.length > 24 && (
                    <button
                      onClick={() => setShowAllTags((v) => !v)}
                      className="rounded-md px-2 py-0.5 text-xs text-accent hover:underline"
                    >
                      {showAllTags ? "less" : `+${tags.length - 24} more`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {activeFilterCount > 0 && (
              <div className="flex justify-end pt-3 border-t border-border">
                <button
                  onClick={() => { clearFilters(); setFilterModalOpen(false); }}
                  className="text-xs text-danger hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
