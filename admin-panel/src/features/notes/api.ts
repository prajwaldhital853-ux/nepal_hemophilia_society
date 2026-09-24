import { apiFetch } from "@/lib/api";

export type NoteTargetType = "patient" | "staff" | "injection" | "treatment" | "bleeding";

export type RecordNote = {
  id: number;
  targetType: NoteTargetType;
  targetId: number;
  targetLabel: string;
  body: string;
  author: { id: number | null; name: string; role: string };
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  canEdit: boolean;
};

export type NotesPage = {
  notes: RecordNote[];
  nextCursor: string | null;
  limit: number;
  canWrite: boolean;
};

export type NoteCounts = Record<NoteTargetType, Record<string, number>>;

function targetPath(targetType: NoteTargetType, targetId: string | number) {
  return `/notes/${targetType}/${encodeURIComponent(String(targetId))}/`;
}

export async function fetchNotes(
  targetType: NoteTargetType,
  targetId: string | number,
  options: { scope?: "all"; type?: NoteTargetType | ""; cursor?: string | null; limit?: number } = {},
): Promise<NotesPage> {
  const q = new URLSearchParams();
  if (options.scope) q.set("scope", options.scope);
  if (options.type) q.set("type", options.type);
  if (options.cursor) q.set("cursor", options.cursor);
  q.set("limit", String(options.limit ?? 20));
  const data = await apiFetch(`${targetPath(targetType, targetId)}?${q.toString()}`);
  return {
    notes: data.notes ?? [],
    nextCursor: data.nextCursor ?? null,
    limit: data.limit ?? 20,
    canWrite: Boolean(data.canWrite),
  };
}

export async function createNote(targetType: NoteTargetType, targetId: string | number, body: string): Promise<RecordNote> {
  const data = await apiFetch(targetPath(targetType, targetId), {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  return data.note;
}

export async function updateNote(id: number, body: string): Promise<RecordNote> {
  const data = await apiFetch(`/notes/${id}/`, { method: "PATCH", body: JSON.stringify({ body }) });
  return data.note;
}

export async function deleteNote(id: number): Promise<void> {
  await apiFetch(`/notes/${id}/`, { method: "DELETE" });
}

export async function fetchNoteCounts(patientId: string): Promise<{ counts: NoteCounts; total: number }> {
  const data = await apiFetch(`/notes/patient/${encodeURIComponent(patientId)}/counts/`);
  return { counts: data.counts ?? {}, total: data.total ?? 0 };
}
