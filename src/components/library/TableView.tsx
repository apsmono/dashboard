import { useState, useCallback } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { LibraryEntry } from "@/types";

const columnHelper = createColumnHelper<LibraryEntry>();

interface TableViewProps {
  entries: LibraryEntry[];
  total: number;
  loading: boolean;
  onEntryClick: (entry: LibraryEntry) => void;
}

export function TableView({ entries, total: _total, loading, onEntryClick }: TableViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- total reserved for future bulk actions
  void _total;
  const [rowSelection, setRowSelection] = useState({});

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
    columnHelper.accessor("title", {
      header: "Title",
      cell: (info) => (
        <div className="truncate max-w-[300px] font-medium">{info.getValue()}</div>
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
      cell: (info) => (
        <span className="text-xs text-muted/60 font-mono-data">{info.getValue()}</span>
      ),
      meta: { width: 140 },
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
    onEntryClick(entry);
  }, [onEntryClick]);

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
            <tr
              key={row.id}
              className="border-b border-border/50 hover:bg-surface/50 cursor-pointer transition-colors"
              onClick={() => handleRowClick(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2.5 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
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
