import { X, ExternalLink, Clock, Tag, FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { LibraryEntry } from "@/types";

interface EntryDetailModalProps {
  entry: LibraryEntry | null;
  onClose: () => void;
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
  // Very lightweight markdown-to-HTML for display
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

export function EntryDetailModal({ entry, onClose }: EntryDetailModalProps) {
  if (!entry) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {platformIcon(entry.source_url)}
            <h2 className="text-lg font-semibold">{entry.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-muted hover:text-text hover:bg-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge>{entry.section}</Badge>
          <Badge variant="accent">{entry.status}</Badge>
          <Badge variant="success">{entry.type}</Badge>
        </div>

        {entry.source_url && (
          <a
            href={entry.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-flex items-center gap-1 text-sm text-accent hover:underline break-all"
          >
            <ExternalLink size={14} />
            {entry.source_url}
          </a>
        )}

        {entry.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {entry.tags.map((t) => (
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
            {entry.captured_at}
          </span>
          <span className="flex items-center gap-1">
            <FileText size={10} />
            {entry.path}
          </span>
        </div>

        {entry.markdown && (
          <div className="mt-4 rounded-lg border border-border bg-surface p-4">
            <div
              className="prose prose-sm max-w-none text-sm text-text"
              dangerouslySetInnerHTML={{ __html: renderMarkdownLite(entry.markdown) }}
            />
          </div>
        )}

        {entry.related && entry.related.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Related</h3>
            <div className="flex flex-wrap gap-1">
              {entry.related.map((r) => (
                <Badge key={r} variant="default">
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
