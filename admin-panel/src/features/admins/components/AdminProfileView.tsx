"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, Shield, Trash2 } from "lucide-react";

import { ActionsMenu, copyText } from "@/components/ui/ActionsMenu";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { deleteStaffAccount, fetchStaffAccount, KIND_LABELS, updateStaffAccount, type StaffRecord } from "@/features/admins/api";
import StaffAccountForm from "@/features/admins/components/StaffAccountForm";
import { isOwnStaffAccount } from "@/features/admins/identity";
import { useAuth } from "@/lib/auth";
import { downloadCsv, stampFilename } from "@/lib/exportCsv";
import { showConfirm } from "@/lib/confirmBus";
import { PERM_LABELS } from "@/lib/permissions";
import { showToast } from "@/lib/toastBus";

const tabs = ["Overview", "Roles & Permissions"];

function InfoRows({ items }: { items: [string, string][] }) {
  return (
    <dl className="mt-3 space-y-2.5">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 text-[11px]">
          <dt className="shrink-0 text-muted">{label}</dt>
          <dd className="text-right font-medium text-ink">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AdminProfileView({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [admin, setAdmin] = useState<StaffRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const isSelf = isOwnStaffAccount(user, admin);
  const canEditThis = Boolean(admin?.canEdit && !isSelf);

  function load() {
    return fetchStaffAccount(id)
      .then(setAdmin)
      .catch((err) => setError(err instanceof Error ? err.message : "Admin not found"));
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function setAccountStatus(status: "Active" | "Inactive") {
    if (!admin) return;
    setBusy(true);
    setError("");
    try {
      const data = await updateStaffAccount(admin.id, { status });
      setAdmin(data.admin ?? data.staff);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  }

  if (error && !admin) return <p className="p-4 text-[12px] text-red-600">{error}</p>;
  if (!admin) return <p className="p-4 text-[12px] text-muted">Loading {id}…</p>;

  const isOverview = tab === "Overview";
  const roleLabel = KIND_LABELS[admin.kind] || admin.roleLabel;
  const scopeLabel = admin.treatmentCenter
    ? `${admin.treatmentCenter} · ${admin.province}`
    : admin.province || "National";
  const granted = admin.permissionLabels?.length
    ? admin.permissionLabels
    : (admin.effectivePermissions || []).map((code) => ({ code, label: PERM_LABELS[code] || code }));

  return (
    <div className="admin-page admin-page--fill">
      <div className="admin-profile-sticky space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[16px] font-semibold text-ink">Admin Profile</h1>
          <p className="text-[11px] text-muted">
            Home &gt; Admin Management &gt;{" "}
            <Link href="/dashboard/admins" className="hover:text-brand">
              Admins
            </Link>{" "}
            &gt; {admin.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEditThis ? (
            <>
              <button
                type="button"
                className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-ink shadow-none"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
              {admin.status === "Pending" ? (
                <button
                  type="button"
                  disabled={busy}
                  className="rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                  onClick={() => void setAccountStatus("Active")}
                >
                  Mark as Active
                </button>
              ) : admin.status === "Inactive" ? (
                <button
                  type="button"
                  disabled={busy}
                  className="panel px-3 py-1.5 text-[11px] font-medium text-ink shadow-none disabled:opacity-60"
                  onClick={() => void setAccountStatus("Active")}
                >
                  Activate
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  className="panel px-3 py-1.5 text-[11px] font-medium text-ink shadow-none disabled:opacity-60"
                  onClick={() => void setAccountStatus("Inactive")}
                >
                  Deactivate
                </button>
              )}
              {admin.canDelete && admin.userId !== user?.id ? (
                <button
                  type="button"
                  className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-red-600 shadow-none"
                  onClick={() => {
                    void showConfirm({
                      message: `Delete admin ${admin.id}? This cannot be undone.`,
                    }).then((confirmed) => {
                      if (!confirmed) return;
                      void deleteStaffAccount(admin.id)
                        .then(() => {
                          showToast("Admin deleted successfully");
                          router.push("/dashboard/admins");
                        })
                        .catch((err: Error) => setError(err.message || "Could not delete admin"));
                    });
                  }}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              ) : null}
            </>
          ) : null}
          <ActionsMenu
            ariaLabel="More admin actions"
            buttonClassName="panel p-1.5 shadow-none"
            iconClassName="size-3.5"
            items={[
              { label: "Copy admin ID", onClick: () => void copyText(admin.id) },
              { label: "Copy email", onClick: () => void copyText(admin.email) },
              { label: "Copy username", onClick: () => void copyText(admin.username) },
              {
                label: "Export profile",
                onClick: () =>
                  downloadCsv(
                    stampFilename(`admin-${admin.id}`),
                    ["Field", "Value"],
                    [
                      ["ID", admin.id],
                      ["Name", admin.fullName],
                      ["Role", roleLabel],
                      ["Email", admin.email],
                      ["Phone", admin.phone || ""],
                      ["Status", admin.status],
                      ["Province", admin.province || "National"],
                      ["Center", admin.treatmentCenter || ""],
                    ],
                  ),
              },
              { label: "View permissions", onClick: () => setTab("Roles & Permissions") },
              {
                label: "Mark as Active",
                hidden: !canEditThis || admin.status !== "Pending",
                onClick: () => void setAccountStatus("Active"),
              },
              {
                label: "Deactivate account",
                hidden: !canEditThis || admin.status !== "Active",
                onClick: () => void setAccountStatus("Inactive"),
              },
              {
                label: "Activate account",
                hidden: !canEditThis || admin.status !== "Inactive",
                onClick: () => void setAccountStatus("Active"),
              },
            ]}
          />
        </div>
      </div>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
      {isSelf ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          This is your own account. Another administrator must update your profile, permissions, or status.
        </p>
      ) : null}

      <div className="tabs-bar">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`tab-link ${tab === item ? "tab-link-active" : ""}`}
          >
            {item}
          </button>
        ))}
      </div>
      </div>

      <div className="admin-page-body">
      <article className="panel flex flex-wrap items-center gap-3 border-l-4 border-l-brand p-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-faint">Province</p>
          <p className="text-[13px] font-semibold text-ink">{admin.province || "National"}</p>
        </div>
        {admin.treatmentCenter ? (
          <>
            <div className="h-8 w-px bg-line-subtle" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-faint">Treatment center</p>
              <p className="text-[13px] font-semibold text-ink">{admin.treatmentCenter}</p>
            </div>
          </>
        ) : null}
        <div className="h-8 w-px bg-line-subtle" />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-faint">Scope</p>
          <p className="text-[13px] font-semibold text-ink">{scopeLabel}</p>
        </div>
      </article>

      <div
        className={
          isOverview
            ? "grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]"
            : "flex flex-col gap-3"
        }
      >
        {isOverview ? (
          <aside className="profile-sidebar lg:self-start">
            <UserAvatar name={admin.fullName} photoUrl={admin.photoUrl} size={80} className="size-20 rounded-md text-[18px]" />
            <h2 className="mt-4 text-[14px] font-semibold">{admin.fullName}</h2>
            <p className="profile-sidebar-meta mt-1 text-[11px]">{roleLabel}</p>
            <p className="profile-sidebar-meta text-[11px]">{admin.province || "National"}</p>
            {admin.treatmentCenter ? <p className="profile-sidebar-meta text-[11px]">{admin.treatmentCenter}</p> : null}
            <span
              className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                admin.status === "Active"
                  ? "bg-status-green-soft text-status-green"
                  : admin.status === "Pending"
                    ? "bg-status-amber-soft text-status-amber"
                    : "bg-elevated text-muted"
              }`}
            >
              {admin.status}
              {admin.viewOnly ? " · View only" : ""}
            </span>
            <div className="profile-sidebar-divider">
              {(
                [
                  ["Email", admin.email],
                  ["Phone", admin.phone],
                  ["Username", admin.username],
                  ["Admin ID", admin.id],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="profile-sidebar-label text-[10px]">{label}</p>
                  <p className="profile-sidebar-value mt-0.5 break-all text-[11px]">{value || "—"}</p>
                </div>
              ))}
            </div>
          </aside>
        ) : null}

        <div className={`min-w-0 ${isOverview ? "" : ""}`}>
          {tab === "Overview" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <article className="panel p-3">
                <h3 className="text-[12px] font-semibold text-ink">Account Information</h3>
                <InfoRows
                  items={[
                    ["Full Name", admin.fullName],
                    ["Email", admin.email],
                    ["Role", roleLabel],
                    ["Designation", admin.designation || ""],
                    ["Status", admin.status],
                    [
                      "Must change password",
                      admin.mustChangePassword
                        ? admin.status === "Pending"
                          ? "Yes — first login or use Mark as Active"
                          : "Yes"
                        : "No",
                    ],
                  ]}
                />
              </article>
              <article className="panel p-3">
                <h3 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                  <Shield className="size-3.5 text-brand" />
                  Scope
                </h3>
                <InfoRows
                  items={[
                    ["Province", admin.province || "National"],
                    ["Treatment center", admin.treatmentCenter || "—"],
                    ["View only", admin.viewOnly ? "Yes" : "No"],
                    ["Office address", admin.officeAddress || ""],
                  ]}
                />
              </article>
            </div>
          ) : (
            <article className="panel p-3">
              <h3 className="text-[12px] font-semibold text-ink">Granted permissions</h3>
              <p className="mt-1 text-[11px] text-muted">
                Only these pages appear in the drawer. Write actions stay hidden in view-only mode.
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {granted.map((perm) => (
                  <li
                    key={perm.code}
                    className="panel-inset flex items-center gap-2 px-2.5 py-2 text-[11px] text-ink shadow-none"
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-status-green-soft">
                      <Check className="size-2.5 text-status-green" />
                    </span>
                    {perm.label}
                  </li>
                ))}
              </ul>
            </article>
          )}
        </div>
      </div>
      </div>

      {editing && canEditThis && admin ? (
        <StaffAccountForm
          mode="edit"
          initial={admin}
          lockedKind={admin.kind}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
