"use client";

import { useEffect, useMemo, useState } from "react";

export function useVisibleSlice<T>(items: T[], pageSize: number) {
  const [count, setCount] = useState(pageSize);
  const total = items.length;

  useEffect(() => {
    setCount(pageSize);
  }, [items, pageSize]);

  const visible = useMemo(() => items.slice(0, count), [items, count]);
  const showing = visible.length;
  const hasMore = count < total;

  return {
    visible,
    showing,
    total,
    hasMore,
    loadMore: () => setCount((current) => Math.min(total, current + pageSize)),
  };
}
