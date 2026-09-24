"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { fetchNoteCounts, type NoteCounts, type NoteTargetType } from "@/features/notes/api";

type Entry = { counts: NoteCounts | null; total: number; inflight: Promise<void> | null; fetchedAt: number };

const FRESH_MS = 30_000;
const store = new Map<string, Entry>();
const listeners = new Set<() => void>();
const EMPTY: Entry = { counts: null, total: 0, inflight: null, fetchedAt: 0 };

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function load(patientId: string) {
  const current = store.get(patientId) ?? EMPTY;
  if (current.inflight) return current.inflight;
  const inflight = fetchNoteCounts(patientId)
    .then(({ counts, total }) => {
      store.set(patientId, { counts, total, inflight: null, fetchedAt: Date.now() });
    })
    .catch(() => {
      store.set(patientId, { ...(store.get(patientId) ?? EMPTY), inflight: null, fetchedAt: Date.now() });
    })
    .finally(emit);
  store.set(patientId, { ...current, inflight });
  emit();
  return inflight;
}

/** Refetches a patient's note counts once for every mounted table. */
export function invalidateNoteCounts(patientId: string) {
  void load(patientId);
}

export function useNoteCounts(patientId: string) {
  const entry = useSyncExternalStore(
    subscribe,
    () => store.get(patientId) ?? EMPTY,
    () => EMPTY,
  );

  useEffect(() => {
    const current = store.get(patientId);
    if (!current || (!current.inflight && Date.now() - current.fetchedAt > FRESH_MS)) void load(patientId);
  }, [patientId]);

  const countFor = useCallback(
    (type: NoteTargetType, id: number | string) => entry.counts?.[type]?.[String(id)] ?? 0,
    [entry.counts],
  );

  return { countFor, total: entry.total };
}
