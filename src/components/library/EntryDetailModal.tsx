import { useState, useCallback } from "react";
import { X, ExternalLink, Clock, Tag, FileText, Loader2, Pencil, Sparkles, BookOpen, Maximize2, Minimize2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useLibraryEntry, useUpdateLibraryEntry, useEntrySynthesis } from "@/hooks/useApi";
import type { LibraryEntry } from "@/types";
import { EntryEditor } from "./EntryEditor";
import { EntryAIPanel } from "./EntryAIPanel";

interface EntryDetailModalProps {
  entry: LibraryEntry | null;
  onClose: () => void;
  onUpdated?: () => void;
}

function platformIcon(source_url?: string) {
  if (!source_url) return null;
  if (source_url.includes("youtube.com") || source_url.includes("youtu.be")) {
    return <span className="text-red-500 text-xs">▶</span>;
  }
  if (source_url.includes("github.com")) {
    return <span className="text-text text-xs">◈</span>;
  }
  return <span className="text-muted text-xs">◉</span>;
}

function renderMarkdownLite(md: string): string {
  return md
    .replace(/^### (.*$)/gim, "<h3 class='text-base font-semibold mt-3 mb-1'>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2 class='text-lg font-semibold mt-4 mb-2'>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1 class='text-xl font-bold mt-4 mb-2'>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/^- (.*$)/gim, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/^\d+\. (.*$)/gim, "<li class='ml-4 list-decimal'>$1</li>")
    .replace(/\n/gim, "<br />");
}

type Tab = "read" | "edit" | "ai";

export function EntryDetailModal({ entry, onClose, onUpdated }: EntryDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("read");
  const [focusMode, setFocusMode] = useState(false);
  const { data: fullEntry, loading } = useLibraryEntry(entry?.id ?? null);
  const { update, updating, error: updateError } = useUpdateLibraryEntry();
  const { ask, answer, loading: aiLoading, error: aiError, reset: resetAi } = useEntrySynthesis();

  const displayEntry = fullEntry ?? entry;

  const handleSave = useCallback(
    async (updates: Parameters<typeof update>[1]) => {
      if (!displayEntry) return;
      try {
        await update(displayEntry.id, updates);
        setActiveTab("read");
        onUpdated?.();
      } catch {
        // error handled in hook
      }
    },
    [displayEntry, update, onUpdated]
  );

  const handleAsk = useCallback(
    async (query: string) => {
      if (!displayEntry) return;
      await ask(displayEntry.id, query);
    },
    [displayEntry, ask]
  );

  const handleTabChange = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      if (tab === "ai") {
        resetAi();
      }
    },
    [resetAi]
  );

  if (!entry) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all ${
        focusMode ? "p-0 sm:p-4" : ""
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg transition-all ${
          focusMode
            ? "max-w-4xl max-h-[100vh] sm:max-h-[95vh] p-6 sm:p-10"
            : "max-w-2xl max-h-[85vh] p-6"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {platformIcon(displayEntry?.source_url)}
            <h2 className={`font-semibold truncate ${focusMode ? "text-xl" : "text-lg"}`}>
              {displayEntry?.title}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {activeTab === "read" && (
              <button
                onClick={() => setFocusMode((v) => !v)}
                className="rounded-lg p-1.5 text-muted hover:text-text hover:bg-surface transition-colors"
                title={focusMode ? "Exit focus mode" : "Focus mode"}
              >
                {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:text-text hover:bg-surface transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge>{displayEntry?.section}</Badge>
          <Badge variant="accent">{displayEntry?.status}</Badge>
          <Badge variant="success">{displayEntry?.type}</Badge>
        </div>

        {displayEntry?.source_url && (
          <a
            href={displayEntry.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-flex items-center gap-1 text-sm text-accent hover:underline break-all"
          >
            <ExternalLink size={14} />
            {displayEntry.source_url}
          </a>
        )}

        {displayEntry?.tags && displayEntry.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {displayEntry.tags.map((t) => (
              <Badge key={t} variant="default">
                <Tag size={10} className="mr-1" />
                {t}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted mb-4">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {displayEntry?.captured_at}
          </span>
          <span className="flex items-center gap-1">
            <FileText size={10} />
            {displayEntry?.path}
          </span>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex items-center gap-1 border-b border-border">
          <button
            onClick={() => handleTabChange("read")}
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "read"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            <BookOpen size={14} />
            Read
          </button>
          <button
            onClick={() => handleTabChange("edit")}
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "edit"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            onClick={() => handleTabChange("ai")}
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "ai"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            <Sparkles size={14} />
            AI
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "read" && (
          <div>
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-accent" />
              </div>
            )}
            {displayEntry?.markdown && (
              <div className={`rounded-lg border border-border bg-surface ${focusMode ? "p-6 sm:p-8" : "p-4"}`}>
                <div
                  className={`prose max-w-none text-text ${focusMode ? "prose-base" : "prose-sm"}`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdownLite(displayEntry.markdown) }}
                />
              </div>
            )}
            {displayEntry?.related && displayEntry.related.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Related</h3>
                <div className="flex flex-wrap gap-1">
                  {displayEntry.related.map((r) => (
                    <Badge key={r} variant="default">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "edit" && displayEntry && (
          <div>
            {updateError && (
              <div className="mb-3 rounded-lg border border-danger bg-banner-error-bg px-3 py-2 text-sm text-banner-error-text">
                {updateError}
              </div>
            )}
            <EntryEditor
              entry={displayEntry}
              onSave={handleSave}
              onCancel={() => setActiveTab("read")}
              saving={updating}
            />
          </div>
        )}

        {activeTab === "ai" && displayEntry && (
          <EntryAIPanel
            key={displayEntry.id}
            entryId={displayEntry.id}
            entryTitle={displayEntry.title}
            onAsk={handleAsk}
            answer={answer}
            loading={aiLoading}
            error={aiError}
          />
        )}
      </div>
    </div>
  );
}
