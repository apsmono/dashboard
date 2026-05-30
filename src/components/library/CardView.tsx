import { ExternalLink, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LibraryEntry } from "@/types";
import {
  platformIcon,
  platformLabel,
  youtubeThumbnail,
  sectionAccentColor,
  sectionAccentBg,
} from "./libraryHelpers";

interface CardViewProps {
  entries: LibraryEntry[];
  onEntryClick: (entry: LibraryEntry) => void;
}

export function CardView({ entries, onEntryClick }: CardViewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry, idx) => (
        <Card
          key={entry.id}
          className={`group cursor-pointer overflow-hidden rounded-lg border-l-4 p-0 hover-glow ${sectionAccentColor(entry.section)}`}
          style={{ animationDelay: `${idx * 50}ms` }}
          onClick={() => onEntryClick(entry)}
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
  );
}
