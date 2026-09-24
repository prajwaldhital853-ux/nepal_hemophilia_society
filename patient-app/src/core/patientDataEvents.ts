type InvalidateListener = (topics: string[]) => void;

const listeners = new Set<InvalidateListener>();

export function onPatientDataInvalidate(listener: InvalidateListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function invalidatePatientData(topics: string[] = ["all"]) {
  listeners.forEach((listener) => listener(topics));
}

const refreshedAt = new Map<string, number>();

/** Skip a focus refetch when the same screen loaded recently. Pull-to-refresh should not use this. */
export function shouldRefresh(key: string, ttlMs = 20000) {
  const now = Date.now();
  const previous = refreshedAt.get(key) ?? 0;
  if (now - previous < ttlMs) return false;
  refreshedAt.set(key, now);
  return true;
}
