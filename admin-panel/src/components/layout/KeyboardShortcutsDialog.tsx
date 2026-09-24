"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Keyboard, X } from "lucide-react";

import {
  SHORTCUTS,
  categoryLabel,
  formatShortcutKeys,
  type ShortcutCategory,
  type ShortcutDef,
} from "@/lib/keyboardShortcuts";

type Props = {
  open: boolean;
  onClose: () => void;
};

const CATEGORY_ORDER: ShortcutCategory[] = [
  "general",
  "header",
  "navigation",
  "page",
  "patients",
  "admins",
  "hospitals",
  "stock",
  "injections",
  "appointments",
  "users",
  "reports",
  "audit",
  "settings",
  "website",
];

export function KeyboardShortcutsDialog({ open, onClose }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const grouped = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? SHORTCUTS.filter(
          (row) =>
            row.label.toLowerCase().includes(needle) ||
            row.description.toLowerCase().includes(needle) ||
            formatShortcutKeys(row.keys).toLowerCase().includes(needle),
        )
      : SHORTCUTS;

    const map = new Map<ShortcutCategory, ShortcutDef[]>();
    for (const category of CATEGORY_ORDER) map.set(category, []);
    for (const row of filtered) {
      const bucket = map.get(row.category);
      if (bucket) bucket.push(row);
    }
    return CATEGORY_ORDER.map((category) => ({
      category,
      rows: map.get(category) ?? [],
    })).filter((group) => group.rows.length > 0);
  }, [query]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-[calc(var(--topbar-h,3.5rem)+1rem)] sm:items-center sm:pt-4"
      onClick={onClose}
    >
      <section
        className="panel flex max-h-[min(88vh,calc(100dvh-var(--topbar-h,3.5rem)-2rem))] w-full max-w-3xl flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="shrink-0 border-b border-line-subtle px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 rounded-lg bg-brand-soft p-2 text-brand">
                <Keyboard className="size-4" />
              </span>
              <div>
                <h2 id="keyboard-shortcuts-title" className="text-[15px] font-semibold text-ink">
                  Keyboard shortcuts
                </h2>
                <p className="mt-0.5 text-[11px] text-muted">
                  Press <kbd className="rounded border border-line bg-elevated px-1 py-0.5 text-[10px]">?</kbd> anytime
                  to open this panel. Shortcuts are disabled while typing in a field.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded p-1 text-muted hover:bg-elevated"
              aria-label="Close shortcuts"
              onClick={onClose}
            >
              <X className="size-4" />
            </button>
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Filter shortcuts</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="panel-inset w-full px-2.5 py-1.5 text-[12px] text-ink outline-none"
              placeholder="Filter shortcuts…"
              autoFocus
            />
          </label>
        </div>

        <div className="admin-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {grouped.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-muted">No shortcuts match your search.</p>
          ) : (
            <div className="space-y-5">
              {grouped.map((group) => (
                <section key={group.category}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {categoryLabel(group.category)}
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-line-subtle">
                    <table className="w-full text-left text-[11px]">
                      <tbody>
                        {group.rows.map((row) => (
                          <tr key={row.id} className="border-b border-line-subtle last:border-b-0">
                            <td className="whitespace-nowrap px-3 py-2 align-top">
                              <div className="flex flex-wrap gap-1">
                                {row.sequence ? (
                                  row.keys.map((key, index) => (
                                    <span key={`${row.id}-${key}-${index}`} className="inline-flex items-center gap-1">
                                      {index > 0 ? <span className="text-[10px] text-faint">then</span> : null}
                                      <kbd className="rounded border border-line bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-ink">
                                        {key}
                                      </kbd>
                                    </span>
                                  ))
                                ) : (
                                  <kbd className="rounded border border-line bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-ink">
                                    {formatShortcutKeys(row.keys)}
                                  </kbd>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <p className="font-semibold text-ink">{row.label}</p>
                              <p className="mt-0.5 text-[10px] leading-4 text-muted">{row.description}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
