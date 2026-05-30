import { useState, useCallback, useEffect, useRef } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Trash2, FileText, MoreHorizontal, ExternalLink, ChevronDown } from "lucide-react";
import type { LibraryEntry } from "@/types";
import { youtubeThumbnail, platformIcon, relativeTime } from "./libraryHelpers";
import { deleteLibraryEntry, synthesizeEntry } from "@/lib/api";

const columnHelper = createColumnHelper<LibraryEntry>();

interface TableViewProps {
  entries: LibraryEntry[];
  total: number;
  loading: boolean;
  onEntryClick?: (entry: LibraryEntry) => void;
  onDeleteEntry: (id: string) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}

/* ------------------------------------------------------------------ */
/*  Expanded row content (inline component)                           */
/* ------------------------------------------------------------------ */

function ExpandedRowContent({ entry }: { entry: LibraryEntry }) {
  const [aiSummary, setAiSummary] = useState<string | null>(entry.ai_summary || null);
  const [summarizing, setSummarizing] = useState(false);

  const handleSummarize = useCallback(async () => {
    setSummarizing(true);
    try {
      const res = await synthesizeEntry(entry.id, entry.title);
      setAiSummary(res.answer || res.reply || null);
    } catch {
      window.alert("Could not generate summary. Please try again.");
    } finally {
      setSummarizing(false);
    }
  }, [entry.id, entry.title]);

  let captured = entry.captured_at;
  try {
    const d = new Date(entry.captured_at);
    if (!isNaN(d.getTime())) {
      captured = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(d);
    }
  } catch { /* keep raw */ }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <div className="text-xs font-semibold text-muted mb-1">Title</div>
          <div className="text-sm text-text">{entry.title}</div>
        </div>

        {/* Summary */}
        {entry.summary && (
          <div>
            <div className="text-xs font-semibold text-muted mb-1">Summary</div>
            <div className="text-sm text-text">{entry.summary}</div>
          </div>
        )}

        {/* AI Summary */}
        <div>
          <div className="text-xs font-semibold text-muted mb-1">AI Summary</div>
          <div className="text-sm text-text">
            {aiSummary || "No summary yet. Click Summarize with AI to generate one."}
          </div>
        </div>

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted mb-1">Tags</div>
            <div className="text-sm text-text">{entry.tags.join(", ")}</div>
          </div>
        )}

        {/* Source URL */}
        {entry.source_url && (
          <div>
            <div className="text-xs font-semibold text-muted mb-1">Source</div>
            <a
              href={entry.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              <ExternalLink size={12} />
              {entry.source_url}
            </a>
          </div>
        )}

        {/* Content preview */}
        {entry.markdown && (
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-muted mb-1">Content</div>
            <div className="text-sm text-muted line-clamp-4">{entry.markdown.slice(0, 400)}</div>
          </div>
        )}

        {/* Captured */}
        <div>
          <div className="text-xs font-semibold text-muted mb-1">Captured</div>
          <div className="text-sm text-text">{captured}</div>
        </div>
      </div>

      {/* AI Summarize button */}
      <div className="mt-4">
        <button
          className="px-4 py-2 text-sm border border-accent/60 text-accent rounded-md hover:bg-accent/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={summarizing}
          onClick={handleSummarize}
        >
          {summarizing ? "Summarizing…" : "Summarize with AI"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table view                                                        */
/* ------------------------------------------------------------------ */

export function TableView({ entries, total: _total, loading, onEntryClick: _onEntryClick, onDeleteEntry, openMenuId, setOpenMenuId }: TableViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- total reserved for future bulk actions; onEntryClick kept for API compat
  void _total;
  void _onEntryClick;
  const [rowSelection, setRowSelection] = useState({});
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
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

  const columns = [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-border"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-border"
        />
      ),
      meta: { width: 40 },
    }),
    columnHelper.display({
      id: "thumbnail",
      header: () => "",
      cell: ({ row }) => {
        const thumb = youtubeThumbnail(row.original.source_url);
        const icon = platformIcon(row.original.source_url) || <FileText size={16} />;
        return (
          <button
            className="w-10 h-10 flex items-center justify-center rounded hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              if (row.original.source_url) window.open(row.original.source_url, "_blank");
            }}
            aria-label={`Open source for ${row.original.title}`}
          >
            {thumb ? (
              <img
                src={thumb}
                alt=""
                className="w-10 h-10 object-cover rounded"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="w-10 h-10 flex items-center justify-center text-muted">{icon}</span>
            )}
          </button>
        );
      },
      meta: { width: 56 },
    }),
    columnHelper.accessor("title", {
      header: "Title",
      cell: (info) => (
        <div className="flex items-center gap-1.5 truncate max-w-[280px] font-medium">
          <ChevronDown
            size={14}
            className={`shrink-0 text-muted transition-transform duration-200 ${
              expandedRowId === info.row.original.id ? "rotate-180 text-accent" : ""
            }`}
            aria-hidden="true"
          />
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("type", {
      header: "Type",
      cell: (info) => (
        <span className="text-xs text-muted">{info.getValue()}</span>
      ),
      meta: { width: 80 },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <span className="text-xs font-medium">{info.getValue()}</span>
      ),
      meta: { width: 80 },
    }),
    columnHelper.accessor("tags", {
      header: "Tags",
      enableSorting: false,
      cell: (info) => (
        <div className="flex gap-1 flex-wrap">
          {info.getValue().slice(0, 3).map((t: string) => (
            <span key={t} className="text-[10px] text-muted">#{t}</span>
          ))}
          {info.getValue().length > 3 && (
            <span className="text-[10px] text-muted/50">+{info.getValue().length - 3}</span>
          )}
        </div>
      ),
      meta: { width: 140 },
    }),
    columnHelper.accessor("source_url", {
      header: "Source",
      enableSorting: false,
      cell: (info) => {
        const url = info.getValue();
        if (!url) return <span className="text-xs text-muted">&mdash;</span>;
        try {
          return <span className="text-xs text-muted">{new URL(url).hostname.replace(/^www\./, "")}</span>;
        } catch {
          return <span className="text-xs text-muted">&mdash;</span>;
        }
      },
      meta: { width: 100 },
    }),
    columnHelper.accessor("captured_at", {
      header: "Date",
      cell: (info) => {
        const raw = info.getValue();
        let display: string = raw;
        try {
          const d = new Date(raw);
          if (!isNaN(d.getTime())) {
            display = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(d);
          }
        } catch { /* keep raw */ }
        return <span className="text-xs text-muted/60" title={relativeTime(raw)}>{display}</span>;
      },
      meta: { width: 120 },
    }),
    columnHelper.display({
      id: "actions",
      header: () => "",
      cell: ({ row }) => (
        <div className="relative" ref={openMenuId === row.original.id ? menuRef : undefined}>
          <button
            className="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface transition-colors"
            title="Entry actions"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === row.original.id ? null : row.original.id);
            }}
            aria-label={`Entry actions for ${row.original.title}`}
          >
            <MoreHorizontal size={16} />
          </button>
          {openMenuId === row.original.id && (
            <div className="absolute top-8 right-0 z-50 w-40 bg-surface border border-border rounded-md shadow-lg py-1" data-menu>
              {row.original.source_url && (
                <button
                  className="flex items-center gap-2 w-full px-3 h-10 text-sm text-text hover:bg-surface/80 text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(row.original.source_url, "_blank");
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
                  if (!window.confirm(`Delete "${row.original.title}"? This cannot be undone.`)) return;
                  deleteLibraryEntry(row.original.id)
                    .then(() => onDeleteEntry(row.original.id))
                    .catch(() => window.alert("Failed to delete entry. Please try again."));
                  setOpenMenuId(null);
                }}
              >
                <Trash2 size={14} /> Delete entry
              </button>
            </div>
          )}
        </div>
      ),
      meta: { width: 40 },
    }),
  ];

  const table = useReactTable({
    data: entries,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleRowClick = useCallback((entry: LibraryEntry) => {
    // Toggle accordion expand
    setExpandedRowId((prev) => (prev === entry.id ? null : entry.id));
  }, []);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full table-fixed" style={{ minWidth: 700 }}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border bg-surface">
              {headerGroup.headers.map((header) => {
                const width = (header.column.columnDef as any).meta?.width;
                return (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-muted"
                    style={{ width: width ?? "auto" }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1 select-none">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <>
              <tr
                key={row.id}
                className={`border-b border-border/50 hover:bg-surface/50 cursor-pointer transition-colors ${
                  expandedRowId === row.original.id ? "bg-surface/40 border-l-2 border-l-accent" : ""
                }`}
                onClick={() => handleRowClick(row.original)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRowClick(row.original);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
              {expandedRowId === row.original.id && (
                <tr key={`${row.id}-expanded`}>
                  <td colSpan={columns.length} className="bg-surface/40 border-t border-border">
                    <ExpandedRowContent entry={row.original} />
                  </td>
                </tr>
              )}
            </>
          ))}
          {entries.length === 0 && !loading && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-muted">
                No entries match your current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
