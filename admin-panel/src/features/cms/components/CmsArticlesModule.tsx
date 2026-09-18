"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import { deleteAdminArticle, fetchAdminArticles, saveAdminArticle } from "@/features/cms/api";
import type { CmsArticle, ContentKind } from "@/features/cms/types";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

const fieldClass =
  "mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand";

const KIND_META: Record<ContentKind, { title: string; crumb: string; hint: string }> = {
  news: {
    title: "News & Notices",
    crumb: "News & Notices",
    hint: "Published items appear when a patient opens Campaigns or other services set to News list.",
  },
  event: {
    title: "Events",
    crumb: "Events",
    hint: "Published events appear under Upcoming Events on the patient Services tab.",
  },
  resource: {
    title: "Resources",
    crumb: "Resources",
    hint: "Guides and download links shown in Educational Resources and Useful Downloads.",
  },
  gallery: {
    title: "Gallery",
    crumb: "Gallery",
    hint: "Photos and captions shown when a service is set to open the gallery.",
  },
  insight: {
    title: "Health insight tips",
    crumb: "Health insights",
    hint: "Short tips shown on the patient My Health Insights screen, under the live charts. Charts themselves come from patient records.",
  },
};

type Props = { kind: ContentKind };

export default function CmsArticlesModule({ kind }: Props) {
  const meta = KIND_META[kind];
  const { can, user } = useAuth();
  const canManage = can(Perm.websiteManage) && !user?.viewOnly;
  const canDelete = can(Perm.websiteDelete) && !user?.viewOnly;
  const [rows, setRows] = useState<CmsArticle[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<CmsArticle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    body: "",
    imageUrl: "",
    fileUrl: "",
    location: "",
    startsAt: "",
    endsAt: "",
    published: true,
    sortOrder: 10,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminArticles({ kind, search });
      setRows(data.articles ?? []);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load content");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [kind, search]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetForm() {
    setForm({
      title: "",
      slug: "",
      summary: "",
      body: "",
      imageUrl: "",
      fileUrl: "",
      location: "",
      startsAt: "",
      endsAt: "",
      published: true,
      sortOrder: 10,
    });
  }

  function openEdit(row: CmsArticle) {
    setEditing(row);
    setForm({
      title: row.title,
      slug: row.slug,
      summary: row.summary || "",
      body: row.body || "",
      imageUrl: row.imageUrl || "",
      fileUrl: row.fileUrl || "",
      location: row.location || "",
      startsAt: row.startsAt ? row.startsAt.slice(0, 16) : "",
      endsAt: row.endsAt ? row.endsAt.slice(0, 16) : "",
      published: row.published,
      sortOrder: row.sortOrder,
    });
    setShowForm(true);
  }

  async function onSave() {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveAdminArticle(
        {
          kind,
          title: form.title.trim(),
          slug: form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          summary: form.summary,
          body: form.body,
          imageUrl: form.imageUrl,
          fileUrl: form.fileUrl,
          location: form.location,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
          published: form.published,
          sortOrder: form.sortOrder,
        },
        editing?.id,
      );
      setShowForm(false);
      setEditing(null);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: CmsArticle) {
    if (!window.confirm(`Delete “${row.title}”?`)) return;
    try {
      await deleteAdminArticle(row.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-ink">{meta.title}</h1>
          <p className="mt-0.5 text-[11px] text-muted">
            Home &gt; {meta.crumb}. {meta.hint}
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-1 rounded bg-brand px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            <Plus className="size-3.5" /> Add
          </button>
        ) : null}
      </div>

      <div className="panel p-3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2 top-2 size-3.5 text-muted" />
          <input
            className={`${fieldClass} mt-0 pl-7`}
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error ? <p className="text-[12px] font-medium text-red">{error}</p> : null}

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[12px]">
          <thead className="border-b border-line-subtle bg-elevated/60 text-[11px] uppercase text-muted">
            <tr>
              <th className="px-3 py-2">Title</th>
              {kind === "event" ? <th className="px-3 py-2">When / where</th> : <th className="px-3 py-2">Summary</th>}
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted">
                  Nothing published yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-line-subtle last:border-0">
                  <td className="px-3 py-2 font-semibold text-ink">{row.title}</td>
                  <td className="px-3 py-2 text-muted">
                    {kind === "event"
                      ? [row.startsAt ? new Date(row.startsAt).toLocaleString() : "", row.location].filter(Boolean).join(" · ") ||
                        "—"
                      : row.summary || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        row.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {row.published ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {canManage ? (
                      <button type="button" className="mr-2 font-semibold text-brand" onClick={() => openEdit(row)}>
                        Edit
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button type="button" className="font-semibold text-red" onClick={() => void onDelete(row)}>
                        Delete
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {nextCursor ? <p className="px-3 py-2 text-[11px] text-muted">More items available — refine search to review them.</p> : null}
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="panel mt-8 w-full max-w-2xl p-4">
            <h2 className="text-[15px] font-semibold text-ink">{editing ? "Edit" : "Add"} {meta.title.toLowerCase()}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-[11px] font-semibold text-muted">
                Title
                <input className={fieldClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>
              <label className="text-[11px] font-semibold text-muted">
                Slug
                <input className={fieldClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </label>
              <label className="sm:col-span-2 text-[11px] font-semibold text-muted">
                Summary
                <input className={fieldClass} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
              </label>
              {kind === "event" ? (
                <>
                  <label className="text-[11px] font-semibold text-muted">
                    Starts
                    <input
                      type="datetime-local"
                      className={fieldClass}
                      value={form.startsAt}
                      onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-muted">
                    Ends
                    <input
                      type="datetime-local"
                      className={fieldClass}
                      value={form.endsAt}
                      onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                    />
                  </label>
                  <label className="sm:col-span-2 text-[11px] font-semibold text-muted">
                    Location
                    <input
                      className={fieldClass}
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </label>
                </>
              ) : null}
              <label className="text-[11px] font-semibold text-muted">
                Image URL
                <input className={fieldClass} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </label>
              <label className="text-[11px] font-semibold text-muted">
                File / download URL
                <input className={fieldClass} value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
              </label>
              <label className="flex items-center gap-2 pt-5 text-[12px] font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                Published
              </label>
              <label className="sm:col-span-2 text-[11px] font-semibold text-muted">
                Detail
                <textarea rows={6} className={fieldClass} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded px-3 py-1.5 text-[12px]"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void onSave()}
                className="rounded bg-brand px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
