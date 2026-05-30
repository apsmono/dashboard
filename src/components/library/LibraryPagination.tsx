import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPageNumbers } from "./libraryHelpers";

interface LibraryPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export function LibraryPagination({
  page,
  totalPages,
  total,
  perPage,
  loading,
  onPageChange,
}: LibraryPaginationProps) {
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages]);

  const showingStart = total === 0 ? 0 : (page - 1) * perPage + 1;
  const showingEnd = Math.min(page * perPage, total);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-3 pt-4">
      {/* Info text */}
      <span className="font-mono-data text-xs text-muted/70">
        Showing{" "}
        <span className="text-text">{showingStart}</span>
        {"–"}
        <span className="text-text">{showingEnd}</span>
        {" "}of{" "}
        <span className="text-text">{total.toLocaleString()}</span>
        {" "}entries
      </span>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1 || loading}
          className="hidden sm:flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card text-xs text-muted hover:text-text hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="First page"
        >
          <ChevronLeft size={13} />
          <ChevronLeft size={13} className="-ml-2" />
        </button>

        {/* Prev */}
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || loading}
          className="flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card text-muted hover:text-text hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 px-1">
          {pageNumbers.map((p, i) =>
            p === "ellipsis" ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted/50">
                {"…"}
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                disabled={loading}
                className={`flex items-center justify-center h-8 min-w-[32px] rounded-md px-2 text-xs font-medium transition-all ${
                  page === p
                    ? "bg-accent text-black"
                    : "border border-border bg-card text-muted hover:text-text hover:border-accent/30"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || loading}
          className="flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card text-muted hover:text-text hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <ChevronRight size={15} />
        </button>

        {/* Last */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages || loading}
          className="hidden sm:flex items-center justify-center h-8 w-8 rounded-md border border-border bg-card text-xs text-muted hover:text-text hover:border-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Last page"
        >
          <ChevronRight size={13} />
          <ChevronRight size={13} className="-ml-2" />
        </button>
      </div>
    </div>
  );
}
