"use client";

type PaginatedScrollProps = {
  children: React.ReactNode;
  showing: number;
  total: number;
  hasMore: boolean;
  onLoadMore: () => void;
  loading?: boolean;
  className?: string;
  label?: string;
};

export function PaginatedScroll({
  children,
  showing,
  total,
  hasMore,
  onLoadMore,
  loading = false,
  className = "",
  label = "records",
}: PaginatedScrollProps) {
  return (
    <div>
      <div className={`admin-panel-scroll ${className}`}>{children}</div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-muted">
          Showing {showing} of {total} {label}
        </p>
        {hasMore ? (
          <button
            type="button"
            disabled={loading}
            onClick={onLoadMore}
            className="rounded border border-line px-2 py-1 text-[10px] font-semibold text-brand disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
