"use client";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton-shimmer rounded-md ${className}`} aria-hidden="true" />;
}

export function StatCardsSkeleton({
  count = 4,
  className = "grid grid-cols-2 gap-2 lg:grid-cols-4",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <article key={index} className="panel p-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-6 w-16" />
        </article>
      ))}
    </div>
  );
}

export function TableBodySkeleton({
  rows = 10,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row}>
          {Array.from({ length: columns }).map((_, col) => (
            <td key={col} className="px-3 py-3">
              <Skeleton className={`h-4 ${col === 0 ? "w-20" : col === 1 ? "w-36" : "w-full max-w-[7rem]"}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function TablePanelSkeleton({
  rows = 10,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3 p-3" aria-busy="true" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-3">
          {Array.from({ length: columns }).map((_, col) => (
            <Skeleton key={col} className={`h-8 flex-1 ${col === 0 ? "max-w-20" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = "h-44" }: { height?: string }) {
  return (
    <article className="panel p-3">
      <Skeleton className="h-4 w-44" />
      <Skeleton className={`mt-3 w-full ${height}`} />
    </article>
  );
}

export function InjectionsSummarySkeleton() {
  return (
    <>
      <StatCardsSkeleton count={6} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" />
      <div className="grid gap-2 lg:grid-cols-[1.4fr_0.8fr]">
        <ChartSkeleton height="h-[188px]" />
        <ChartSkeleton height="h-[140px]" />
      </div>
    </>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <article key={index} className="panel flex items-center gap-3 p-2.5">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </article>
        ))}
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        <ChartSkeleton height="h-52" />
        <ChartSkeleton height="h-52" />
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        <ChartSkeleton height="h-44" />
        <ChartSkeleton height="h-44" />
      </div>
    </div>
  );
}

export function ReportsPageSkeleton() {
  return (
    <div className="flex flex-col gap-3 pb-6" aria-busy="true" aria-label="Loading reports">
      <StatCardsSkeleton count={8} className="grid grid-cols-2 gap-2 lg:grid-cols-4" />
      <div className="grid gap-2 lg:grid-cols-2">
        <ChartSkeleton height="h-48" />
        <ChartSkeleton height="h-48" />
      </div>
      <div className="grid gap-2 lg:grid-cols-3">
        <ChartSkeleton height="h-40" />
        <ChartSkeleton height="h-40" />
        <ChartSkeleton height="h-40" />
      </div>
      <TablePanelSkeleton rows={8} columns={5} />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-md px-3 py-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="mt-1.5 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
