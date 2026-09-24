"use client";

import { useEffect } from "react";
import { MessageSquareText, X } from "lucide-react";

import type { NoteTargetType } from "@/features/notes/api";
import { NotesThread } from "@/features/notes/components/NotesThread";

export function NotesDrawer({
  targetType,
  targetId,
  title,
  subtitle,
  legacyNote,
  onClose,
  onChanged,
}: {
  targetType: NoteTargetType;
  targetId: string | number;
  title: string;
  subtitle?: string;
  legacyNote?: { label: string; body: string } | null;
  onClose: () => void;
  onChanged?: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex h-full w-full max-w-md flex-col border-l border-line bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line-subtle px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase text-faint">Notes</p>
            <h2 className="truncate text-[13px] font-semibold text-ink">{title}</h2>
            {subtitle ? <p className="truncate text-[11px] text-muted">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted hover:bg-elevated" aria-label="Close notes">
            <X className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <NotesThread targetType={targetType} targetId={targetId} legacyNote={legacyNote} onChanged={onChanged} />
        </div>
      </aside>
    </div>
  );
}

export function NotesButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
        count ? "bg-brand-soft text-brand" : "text-faint hover:bg-elevated hover:text-ink"
      }`}
      aria-label={count ? `${count} notes` : "Add note"}
      title={count ? `${count} note${count === 1 ? "" : "s"}` : "Add note"}
    >
      <MessageSquareText className="size-3" />
      {count || null}
    </button>
  );
}
