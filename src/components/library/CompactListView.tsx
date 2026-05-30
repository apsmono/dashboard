import { BookOpen, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { LibraryEntry } from "@/types";
import {
  platformIcon,
  sectionAccentColor,
  sectionAccentBg,
} from "./libraryHelpers";

interface CompactListViewProps {
  entries: LibraryEntry[];
  onEntryClick: (entry: LibraryEntry) => void;
}

export function CompactListView({ entries, onEntryClick }: CompactListViewProps) {
  return (
    <div className="space-y-1.5">
      {entries.map((entry, idx) => (
        <div
          key={entry.id}
          className={`group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 cursor-pointer transition-all hover:border-accent/30 hover:bg-surface/50 ${sectionAccentColor(entry.section)} border-l-4`}
          style={{ animationDelay: `${idx * 30}ms` }}
          onClick={() => onEntryClick(entry)}
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
  );
}
