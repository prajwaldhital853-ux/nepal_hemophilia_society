"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Download, Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import {
  deleteStaffAccount,
  fetchStaffCatalog,
  fetchStaffDirectory,
  updateStaffAccount,
  KIND_LABELS,
  type StaffKind,
  type StaffRecord,
} from "@/features/admins/api";
import StaffAccountForm from "@/features/admins/components/StaffAccountForm";
import { isOwnStaffAccount } from "@/features/admins/identity";
import { NEPAL_PROVINCES } from "@/lib/constants/provinces";
import { useAuth } from "@/lib/auth";
import { downloadCsv, stampFilename } from "@/lib/exportCsv";
import { formatNumber } from "@/lib/format";
import { useShortcutAction } from "@/hooks/useShortcutAction";
import { Perm } from "@/lib/permissions";
import { usePageRbac } from "@/components/rbac/ReadOnlyBanner";
import { ActionsMenu, copyText } from "@/components/ui/ActionsMenu";
import { TableBodySkeleton } from "@/components/ui/Skeleton";
import { showConfirm } from "@/lib/confirmBus";
import { showToast } from "@/lib/toastBus";
import { useLocale } from "@/lib/i18n";

function statusClass(status: string) {
  if (status === "Active") return "bg-status-green-soft text-status-green";
  if (status === "Pending") return "bg-status-amber-soft text-status-amber";
  return "bg-elevated text-muted";
}

const TABS: { id: "" | StaffKind; label: string }[] = [
  { id: "", label: "All" },
  { id: "super_admin", label: "Super Admin" },
  { id: "admin", label: "Admin" },
  { id: "province_admin", label: "Province" },
  { id: "center_admin", label: "Center" },
  { id: "treatment_admin", label: "Treatment" },
  { id: "website_manager", label: "Website" },
];

function profileHref(row: StaffRecord) {
  if (row.kind === "treatment_admin") return `/dashboard/hospitals/treatment-admins/${row.id}`;
  if (row.kind === "center_admin") return `/dashboard/hospitals/center-admins/${row.id}`;
  return `/dashboard/admins/${row.id}`;
}

export default function AdminsModule() {
  const router = useRouter();
  const { t, l } = useLocale();
  const { can, user } = useAuth();
  const { readOnly } = usePageRbac("admins");
  const canManage = (can(Perm.adminsManage) || can(Perm.provinceAdminsManage) || can(Perm.hospitalStaffManage)) && !user?.viewOnly;
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [province, setProvince] = useState("All");
  const [kind, setKind] = useState<"" | StaffKind>("");
  const [openProvince, setOpenProvince] = useState(false);
  const [rows, setRows] = useState<StaffRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [roles, setRoles] = useState<StaffKind[]>([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchStaffDirectory({
        kind: kind || undefined,
        search: debounced,
        province,
        limit: 25,
      });
      setRows(data.staff);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setRows([]);
      setNextCursor(null);
      showToast(err instanceof Error ? err.message : "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchStaffDirectory({
        kind: kind || undefined,
        search: debounced,
        province,
        cursor: nextCursor,
        limit: 25,
      });
      setRows((current) => [...current, ...data.staff]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load more admins");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    void fetchStaffCatalog()
      .then((data) => setRoles(data.assignableRoles.map((role) => role.kind)))
      .catch(() => setRoles([]));
  }, []);

  useEffect(() => {
    void load();
  }, [kind, province, debounced]);

  useShortcutAction("page-refresh", () => {
    void load();
  });

  const visible = rows;

  return (
    <div className="admin-page admin-page--fill">
      <div className="admin-page-sticky admin-page-sticky--fixed space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">{t("admins.title")}</h1>
          <p className="text-[11px] text-muted">
            Home &gt; Admin Management — create and control only the roles your account is allowed to manage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-shortcut-target="page-export"
            className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted"
            onClick={() =>
              downloadCsv(
                stampFilename("admins"),
                ["ID", "Name", "Role", "Email", "Phone", "Province", "Center", "Status", "Last login"],
                visible.map((row) => [
                  row.id,
                  row.fullName,
                  row.roleLabel,
                  row.email,
                  row.phone,
                  row.province,
                  row.treatmentCenter,
                  row.status,
                  row.lastLogin || "",
                ]),
              )
            }
          >
            <Download className="size-3.5" />
            {t("common.export")}
          </button>
          {canManage && !readOnly ? (
            <button
              type="button"
              data-shortcut-target="page-new"
              className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
              onClick={() => setShowForm(true)}
            >
              <Plus className="size-3.5" />
              {t("admins.addAdmin")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {TABS.filter((tab) => !tab.id || roles.includes(tab.id)).map((tab) => (
          <button
            key={tab.id || "all"}
            type="button"
            onClick={() => setKind(tab.id)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              kind === tab.id ? "bg-brand text-white" : "bg-elevated text-muted hover:text-ink"
            }`}
          >
            {l(tab.label)}
          </button>
        ))}
      </div>

        <div className="filter-bar">
          <label className="panel-inset flex h-8 min-w-[200px] flex-1 items-center gap-2 px-2.5 shadow-none">
            <Search className="size-3.5 text-faint" />
            <input
              data-shortcut-target="page-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
              placeholder={t("common.searchAdmins")}
            />
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenProvince((v) => !v)}
              className="panel flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
            >
              {province === "All" ? t("common.allProvinces") : `${province} ${t("common.province")}`}
              <ChevronDown className="size-3.5" />
            </button>
            {openProvince ? (
              <div className="absolute z-20 mt-1 w-48 overflow-hidden panel shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[11px] hover:bg-elevated"
                  onClick={() => {
                    setProvince("All");
                    setOpenProvince(false);
                  }}
                >
                  All Provinces
                </button>
                {NEPAL_PROVINCES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-brand-soft ${
                      province === item ? "bg-brand text-white hover:bg-brand" : ""
                    }`}
                    onClick={() => {
                      setProvince(item);
                      setOpenProvince(false);
                    }}
                  >
                    {item} Province
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {province !== "All" ? (
            <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
              {province} Province
              <button type="button" onClick={() => setProvince("All")} aria-label="Clear province">
                <X className="size-3" />
              </button>
            </span>
          ) : null}

          <p className="text-[11px] text-muted">
            {t("admins.adminsCount")}: <span className="text-[15px] font-semibold text-ink">{formatNumber(visible.length)}</span>
          </p>
        </div>
      </div>

      <section className="panel admin-list-panel overflow-hidden">
        <div className="admin-table-scroll overflow-x-auto">
          <table className="data-table w-full min-w-[880px] text-left text-sm">
            <thead className="bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {[t("admins.adminId"), t("common.name"), t("common.email"), t("admins.role"), t("common.scope"), t("common.access"), t("common.status"), t("common.actions")].map((h) => (
                  <th key={h} className="px-3 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableBodySkeleton rows={10} columns={8} />
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-[11px] text-muted">
                    No admins in this filter. Add an admin with the roles you are allowed to create.
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.id} className="hover:bg-elevated/70 dark:hover:bg-white/[0.03]">
                    <td className="px-3 py-3 font-medium text-brand">{row.id}</td>
                    <td className="px-3 py-3 font-semibold text-ink">{row.fullName}</td>
                    <td className="px-3 py-3 text-muted">{row.email}</td>
                    <td className="px-3 py-3 text-ink">{l(KIND_LABELS[row.kind] || row.roleLabel)}</td>
                    <td className="px-3 py-3 text-ink">{row.treatmentCenter || row.province || "National"}</td>
                    <td className="px-3 py-3 text-[11px] text-muted">{row.viewOnly ? t("common.viewOnly") : t("common.full")}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                        {l(row.status)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 text-muted">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-brand hover:bg-brand-soft"
                          aria-label={`View ${row.fullName}`}
                          onClick={() => router.push(profileHref(row))}
                        >
                          <Eye className="size-[15px]" />
                        </button>
                        {canManage && row.canEdit && !isOwnStaffAccount(user, row) && row.status === "Pending" ? (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-status-green hover:bg-status-green-soft"
                            aria-label={`Mark ${row.fullName} as active`}
                            title="Mark as Active"
                            onClick={() => {
                              void updateStaffAccount(row.id, { status: "Active" })
                                .then(() => void load())
                                .catch((err: Error) => showToast(err.message || "Could not activate admin"));
                            }}
                          >
                            <CheckCircle2 className="size-[15px]" />
                          </button>
                        ) : null}
                        {canManage && row.canEdit && !isOwnStaffAccount(user, row) ? (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 hover:bg-elevated"
                            aria-label={`Edit ${row.fullName}`}
                            onClick={() => router.push(profileHref(row))}
                          >
                            <Pencil className="size-[15px]" />
                          </button>
                        ) : null}
                        {row.canDelete ? (
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${row.fullName}`}
                            onClick={() => {
                              void showConfirm({
                                message: `Delete admin ${row.id} (${row.fullName})? This cannot be undone.`,
                              }).then((confirmed) => {
                                if (!confirmed) return;
                                void deleteStaffAccount(row.id)
                                  .then(() => {
                                    setRows((current) => current.filter((item) => item.id !== row.id));
                                    showToast("Admin deleted successfully");
                                  })
                                  .catch((err: Error) => showToast(err.message || "Could not delete admin"));
                              });
                            }}
                          >
                            <Trash2 className="size-[15px]" />
                          </button>
                        ) : null}
                        <ActionsMenu
                          ariaLabel={`More actions for ${row.fullName}`}
                          items={[
                            { label: "View profile", href: profileHref(row) },
                            {
                              label: "Edit profile",
                              href: profileHref(row),
                              hidden: !canManage || !row.canEdit || isOwnStaffAccount(user, row),
                            },
                            { label: "Copy admin ID", onClick: () => void copyText(row.id) },
                            { label: "Copy email", onClick: () => void copyText(row.email) },
                            {
                              label: "Export row",
                              onClick: () =>
                                downloadCsv(
                                  stampFilename(`admin-${row.id}`),
                                  ["Field", "Value"],
                                  [
                                    ["ID", row.id],
                                    ["Name", row.fullName],
                                    ["Role", row.roleLabel],
                                    ["Email", row.email],
                                    ["Phone", row.phone || ""],
                                    ["Province", row.province || ""],
                                    ["Center", row.treatmentCenter || ""],
                                    ["Status", row.status],
                                  ],
                                ),
                            },
                            {
                              label: "Mark as Active",
                              hidden: !canManage || !row.canEdit || isOwnStaffAccount(user, row) || row.status !== "Pending",
                              onClick: () => {
                                void updateStaffAccount(row.id, { status: "Active" })
                                  .then(() => void load())
                                  .catch((err: Error) => showToast(err.message || "Could not activate admin"));
                              },
                            },
                            {
                              label: "Delete admin",
                              destructive: true,
                              hidden: !row.canDelete,
                              onClick: () => {
                                void showConfirm({
                                  message: `Delete admin ${row.id} (${row.fullName})? This cannot be undone.`,
                                }).then((confirmed) => {
                                  if (!confirmed) return;
                                  void deleteStaffAccount(row.id)
                                    .then(() => {
                                      setRows((current) => current.filter((item) => item.id !== row.id));
                                      showToast("Admin deleted successfully");
                                    })
                                    .catch((err: Error) => showToast(err.message || "Could not delete admin"));
                                });
                              },
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {nextCursor ? (
          <div className="flex justify-end border-t border-line-subtle px-3 py-2">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="rounded border border-line px-2 py-1 text-[11px] font-semibold text-brand disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        ) : null}
      </section>

      {showForm ? (
        <StaffAccountForm
          takenProvinces={rows.filter((row) => row.kind === "province_admin").map((row) => row.province)}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
