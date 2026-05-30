import { useState, useEffect, useRef } from "react";
import { ExternalLink, Clock, MoreHorizontal, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LibraryEntry } from "@/types";
import { deleteLibraryEntry } from "@/lib/api";
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
  onDeleteEntry: (id: string) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}

export function CardView({ entries, onEntryClick, onDeleteEntry, openMenuId, setOpenMenuId }: CardViewProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click-outside
  useEffect(() => {
    if (!openMenuId) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [openMenuId, setOpenMenuId]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry, idx) => (
        <Card
          key={entry.id}
          className={`group relative cursor-pointer overflow-hidden rounded-lg border-l-4 p-0 hover-glow ${sectionAccentColor(entry.section)}`}
          style={{ animationDelay: `${idx * 50}ms` }}
          onClick={() => onEntryClick(entry)}
        >
          {/* Hover-reveal overflow menu button */}
          <button
            className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-muted hover:text-text hover:bg-surface z-10"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === entry.id ? null : entry.id);
            }}
            aria-label={`Entry actions for ${entry.title}`}
          >
            <MoreHorizontal size={16} />
          </button>

          {/* Menu panel */}
          {openMenuId === entry.id && (
            <div
              ref={menuRef}
              className="absolute top-10 right-2 z-50 w-40 bg-surface border border-border rounded-md shadow-lg py-1"
              data-menu
            >
              {entry.source_url && (
                <button
                  className="flex items-center gap-2 w-full px-3 h-10 text-sm text-text hover:bg-surface/80 text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(entry.source_url, "_blank");
                    setOpenMenuId(null);
                  }}
                >
                  <ExternalLink size={14} /> Open source URL
                </button>
              )}
              <button
                className="flex items-center gap-2 w-full px-3 h-10 text-sm text-danger hover:bg-danger/10 text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!window.confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
                  deleteLibraryEntry(entry.id)
                    .then(() => onDeleteEntry(entry.id))
                    .catch(() => window.alert("Failed to delete entry. Please try again."));
                  setOpenMenuId(null);
                }}
              >
                <Trash2 size={14} /> Delete entry
              </button>
            </div>
          )}

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
