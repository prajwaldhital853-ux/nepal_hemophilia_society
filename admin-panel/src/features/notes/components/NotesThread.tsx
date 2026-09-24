"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquareText, Pencil, Trash2 } from "lucide-react";

import {
  createNote,
  deleteNote,
  fetchNotes,
  updateNote,
  type NoteTargetType,
  type RecordNote,
} from "@/features/notes/api";
import { formatDateTime, relativeTime } from "@/features/users/presence";
import { showConfirm } from "@/lib/confirmBus";
import { showToast } from "@/lib/toastBus";

const MAX_LENGTH = 4000;

const FILTERS: { id: NoteTargetType | ""; label: string }[] = [
  { id: "", label: "All" },
  { id: "patient", label: "General" },
  { id: "injection", label: "Injections" },
  { id: "treatment", label: "Treatments" },
  { id: "bleeding", label: "Bleeding" },
];

const TYPE_LABEL: Record<NoteTargetType, string> = {
  patient: "General",
  staff: "Account",
  injection: "Injection",
  treatment: "Treatment",
  bleeding: "Bleed",
};

type Props = {
  targetType: NoteTargetType;
  targetId: string | number;
  /** Patient only: include notes written on the patient's injections, treatments and bleeds. */
  aggregate?: boolean;
  legacyNote?: { label: string; body: string } | null;
  placeholder?: string;
  onChanged?: () => void;
  className?: string;
};

export function NotesThread({
  targetType,
  targetId,
  aggregate = false,
  legacyNote,
  placeholder = "Add a follow-up note visible to other staff…",
  onChanged,
  className = "",
}: Props) {
  const [notes, setNotes] = useState<RecordNote[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<NoteTargetType | "">("");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const scope = aggregate && targetType === "patient" ? "all" : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const page = await fetchNotes(targetType, targetId, { scope, type: scope ? filter : "" });
      setNotes(page.notes);
      setNextCursor(page.nextCursor);
      setCanWrite(page.canWrite);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notes");
      setNotes([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, scope, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchNotes(targetType, targetId, { scope, type: scope ? filter : "", cursor: nextCursor });
      setNotes((current) => [...current, ...page.notes]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not load more notes");
    } finally {
      setLoadingMore(false);
    }
  }

  async function submit() {
    const body = draft.trim();
    if (!body || saving) return;
    setSaving(true);
    try {
      const note = await createNote(targetType, targetId, body);
      setDraft("");
      if (!filter || filter === note.targetType) setNotes((current) => [note, ...current]);
      onChanged?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save note");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(note: RecordNote) {
    const body = editDraft.trim();
    if (!body || body === note.body) {
      setEditingId(null);
      return;
    }
    try {
      const updated = await updateNote(note.id, body);
      setNotes((current) => current.map((row) => (row.id === note.id ? updated : row)));
      setEditingId(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update note");
    }
  }

  async function remove(note: RecordNote) {
    const ok = await showConfirm({ message: "Delete this note? This cannot be undone." });
    if (!ok) return;
    try {
      await deleteNote(note.id);
      setNotes((current) => current.filter((row) => row.id !== note.id));
      onChanged?.();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete note");
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {canWrite ? (
        <form
          className="rounded border border-line-subtle bg-elevated/60 p-2"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                void submit();
              }
            }}
            rows={3}
            placeholder={placeholder}
            className="w-full resize-y bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[10px] text-faint">
              {draft.length > MAX_LENGTH - 400 ? `${MAX_LENGTH - draft.length} characters left · ` : ""}
              Ctrl + Enter to save
            </span>
            <button
              type="submit"
              disabled={!draft.trim() || saving}
              className="rounded bg-brand px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add note"}
            </button>
          </div>
        </form>
      ) : null}

      {scope ? (
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item.id || "all"}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                filter === item.id ? "border-brand bg-brand-soft text-brand" : "border-line-subtle text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {legacyNote?.body && (!scope || !filter || filter === "patient") ? (
        <div className="rounded border border-dashed border-line-subtle px-3 py-2">
          <p className="text-[10px] font-semibold uppercase text-faint">{legacyNote.label}</p>
          <p className="mt-1 whitespace-pre-wrap text-[12px] text-ink">{legacyNote.body}</p>
        </div>
      ) : null}

      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-14 animate-pulse rounded bg-elevated" />
          ))}
        </div>
      ) : notes.length === 0 && !error ? (
        <div className="flex flex-col items-center gap-1.5 py-8 text-center">
          <MessageSquareText className="size-5 text-faint" />
          <p className="text-[11px] text-muted">No notes yet.</p>
        </div>
      ) : (
        <ol className="divide-y divide-line-subtle">
          {notes.map((note) => (
            <li key={note.id} className="py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-ink">
                    {note.author.name}
                    {note.author.role ? <span className="ml-1.5 font-normal text-muted">{note.author.role}</span> : null}
                  </p>
                  <p className="text-[10px] text-faint" title={formatDateTime(note.createdAt)}>
                    {relativeTime(note.createdAt)}
                    {note.edited ? <span title={`Edited ${formatDateTime(note.updatedAt)}`}> · edited</span> : null}
                  </p>
                </div>
                {note.canEdit && editingId !== note.id ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(note.id);
                        setEditDraft(note.body);
                      }}
                      className="rounded p-1 text-faint hover:bg-elevated hover:text-ink"
                      aria-label="Edit note"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(note)}
                      className="rounded p-1 text-faint hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete note"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ) : null}
              </div>
              {scope && note.targetType !== "patient" ? (
                <p className="mt-1 inline-block rounded bg-elevated px-1.5 py-0.5 text-[10px] text-muted">
                  {note.targetLabel || TYPE_LABEL[note.targetType]}
                </p>
              ) : null}
              {editingId === note.id ? (
                <div className="mt-1.5">
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value.slice(0, MAX_LENGTH))}
                    rows={3}
                    autoFocus
                    className="w-full rounded border border-line-subtle bg-elevated px-2 py-1.5 text-[12px] text-ink outline-none focus:border-brand"
                  />
                  <div className="mt-1 flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingId(null)} className="text-[11px] text-muted">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveEdit(note)}
                      disabled={!editDraft.trim()}
                      className="rounded bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-ink">{note.body}</p>
              )}
            </li>
          ))}
        </ol>
      )}

      {nextCursor ? (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="w-full rounded border border-line-subtle py-1.5 text-[11px] font-medium text-muted hover:text-ink disabled:opacity-60"
        >
          {loadingMore ? "Loading…" : "Load older notes"}
        </button>
      ) : null}
    </div>
  );
}
