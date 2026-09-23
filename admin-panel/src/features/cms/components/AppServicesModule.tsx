"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import { PaginatedScroll } from "@/components/ui/PaginatedScroll";
import { TablePanelSkeleton } from "@/components/ui/Skeleton";
import { deleteAdminService, fetchAdminServices, saveAdminService } from "@/features/cms/api";
import {
  APP_SCREENS,
  SERVICE_ACTIONS,
  SERVICE_CATEGORIES,
  type AppService,
  type ServiceActionType,
  type ServiceCategoryId,
} from "@/features/cms/types";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";
import { useToast } from "@/lib/toast";
import { showToast } from "@/lib/toastBus";
import { useVisibleSlice } from "@/lib/useVisibleSlice";

const fieldClass =
  "mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand";

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  body: "",
  category: "treatment" as ServiceCategoryId,
  iconSet: "ion" as "ion" | "mci",
  iconName: "medkit-outline",
  actionType: "content" as ServiceActionType,
  actionValue: "",
  phone: "",
  email: "",
  websiteUrl: "",
  address: "",
  published: true,
  sortOrder: 10,
};

function slugFromTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

export default function AppServicesModule() {
  const toast = useToast();
  const { can, user } = useAuth();
  const canManage = can(Perm.websiteManage) && !user?.viewOnly;
  const canDelete = can(Perm.websiteDelete) && !user?.viewOnly;
  const [rows, setRows] = useState<AppService[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AppService | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminServices({ search, category });
      setRows(data.services ?? []);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load services";
      setError(message);
      toast.show(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(row: AppService) {
    setEditing(row);
    setForm({
      title: row.title,
      slug: row.slug,
      description: row.description,
      body: row.body || "",
      category: row.category,
      iconSet: row.iconSet,
      iconName: row.iconName,
      actionType: row.actionType,
      actionValue: row.actionValue || "",
      phone: row.phone || "",
      email: row.email || "",
      websiteUrl: row.websiteUrl || "",
      address: row.address || "",
      published: row.published,
      sortOrder: row.sortOrder,
    });
    setShowForm(true);
  }

  const servicesPage = useVisibleSlice(rows, 10);

  async function loadMore() {
    if (servicesPage.hasMore) {
      servicesPage.loadMore();
      return;
    }
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchAdminServices({ search, category, cursor: nextCursor });
      setRows((current) => [...current, ...(data.services ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load more";
      setError(message);
      toast.show(message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function onSave() {
    if (!form.title.trim()) {
      const message = "Title is required.";
      setError(message);
      toast.show(message);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const slug = form.slug.trim() || slugFromTitle(form.title);
      await saveAdminService(
        {
          ...form,
          slug,
          title: form.title.trim(),
          description: form.description.trim(),
        },
        editing?.id,
      );
      setShowForm(false);
      showToast(editing ? "Service updated" : "Service published");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save service";
      setError(message);
      toast.show(message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: AppService) {
    if (!window.confirm(`Delete “${row.title}” from the patient app?`)) return;
    setError("");
    try {
      await deleteAdminService(row.id);
      showToast("Service deleted");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete service";
      setError(message);
      toast.show(message);
    }
  }

  return (
    <div className="admin-page">
      <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-ink">App Services</h1>
          <p className="mt-0.5 text-[11px] text-muted">
            Home &gt; Website Content. These cards appear on the patient mobile Services tab. Detail copy, phone
            numbers, and whether a card opens a screen are all controlled here.
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1 rounded bg-brand px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            <Plus className="size-3.5" /> Add service
          </button>
        ) : null}
      </div>

      <div className="panel flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-2 size-3.5 text-muted" />
          <input
            className={`${fieldClass} mt-0 pl-7`}
            placeholder="Search title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={fieldClass + " mt-0 w-auto"} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="All">All categories</option>
          {SERVICE_CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-[12px] font-medium text-red">{error}</p> : null}
      </div>

      <section className="panel overflow-x-auto p-3">
        {loading ? (
          <TablePanelSkeleton rows={10} columns={5} />
        ) : (
        <PaginatedScroll
          showing={servicesPage.showing}
          total={rows.length}
          hasMore={servicesPage.hasMore || Boolean(nextCursor)}
          onLoadMore={() => void loadMore()}
          loading={loadingMore}
          label="services"
          scroll={false}
        >
        <table className="w-full min-w-[760px] text-left text-[12px]">
          <thead className="border-b border-line-subtle bg-elevated text-[11px] uppercase text-muted">
            <tr>
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Opens</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted">
                  No services yet.
                </td>
              </tr>
            ) : (
              servicesPage.visible.map((row) => (
                <tr key={row.id} className="border-b border-line-subtle last:border-0">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-ink">{row.title}</p>
                    <p className="text-[11px] text-muted">{row.description}</p>
                  </td>
                  <td className="px-3 py-2 text-muted">{row.categoryLabel}</td>
                  <td className="px-3 py-2 text-muted">
                    {row.actionLabel}
                    {row.actionValue ? ` · ${row.actionValue}` : ""}
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
        </PaginatedScroll>
        )}
      </section>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="panel mt-8 w-full max-w-2xl p-4">
            <h2 className="text-[15px] font-semibold text-ink">{editing ? "Edit service" : "Add service"}</h2>
            <p className="mb-3 text-[11px] text-muted">
              Published services show immediately in the patient app after save.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-[11px] font-semibold text-muted">
                Title
                <input
                  className={fieldClass}
                  value={form.title}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      title: e.target.value,
                      slug: editing ? current.slug : slugFromTitle(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="text-[11px] font-semibold text-muted">
                Slug
                <input className={fieldClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </label>
              <label className="sm:col-span-2 text-[11px] font-semibold text-muted">
                Short description
                <input
                  className={fieldClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <label className="text-[11px] font-semibold text-muted">
                Category
                <select
                  className={fieldClass}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategoryId })}
                >
                  {SERVICE_CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-muted">
                When tapped
                <select
                  className={fieldClass}
                  value={form.actionType}
                  onChange={(e) => setForm({ ...form, actionType: e.target.value as ServiceActionType })}
                >
                  {SERVICE_ACTIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              {form.actionType === "app_screen" ? (
                <label className="text-[11px] font-semibold text-muted">
                  App screen
                  <select
                    className={fieldClass}
                    value={form.actionValue}
                    onChange={(e) => setForm({ ...form, actionValue: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {APP_SCREENS.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {form.actionType === "url" ? (
                <label className="text-[11px] font-semibold text-muted">
                  URL
                  <input
                    className={fieldClass}
                    value={form.actionValue}
                    onChange={(e) => setForm({ ...form, actionValue: e.target.value })}
                  />
                </label>
              ) : null}
              <label className="text-[11px] font-semibold text-muted">
                Icon set
                <select
                  className={fieldClass}
                  value={form.iconSet}
                  onChange={(e) => setForm({ ...form, iconSet: e.target.value as "ion" | "mci" })}
                >
                  <option value="ion">Ionicons</option>
                  <option value="mci">Material Community</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-muted">
                Icon name
                <input
                  className={fieldClass}
                  value={form.iconName}
                  onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                />
              </label>
              <label className="text-[11px] font-semibold text-muted">
                Phone
                <input className={fieldClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label className="text-[11px] font-semibold text-muted">
                Email
                <input className={fieldClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="text-[11px] font-semibold text-muted">
                Website
                <input
                  className={fieldClass}
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                />
              </label>
              <label className="text-[11px] font-semibold text-muted">
                Address
                <input
                  className={fieldClass}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </label>
              <label className="text-[11px] font-semibold text-muted">
                Sort order
                <input
                  type="number"
                  className={fieldClass}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
                />
              </label>
              <label className="flex items-center gap-2 pt-5 text-[12px] font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                Published on patient app
              </label>
              <label className="sm:col-span-2 text-[11px] font-semibold text-muted">
                Detail page copy
                <textarea
                  rows={6}
                  className={fieldClass}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded px-3 py-1.5 text-[12px]" onClick={() => setShowForm(false)}>
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
