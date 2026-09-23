"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Check, FileText, Pencil, Shield, Trash2 } from "lucide-react";

import { ActionsMenu, copyText } from "@/components/ui/ActionsMenu";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { fetchHospitalStaffProfile } from "@/features/hospitals/api";
import StaffAccountForm from "@/features/admins/components/StaffAccountForm";
import { deleteStaffAccount, fetchStaffAccount, updateStaffAccount, type StaffRecord } from "@/features/admins/api";
import { isOwnStaffAccount } from "@/features/admins/identity";
import { staffLabels, type HospitalStaffProfile, type HospitalStaffType } from "@/features/hospitals/types";
import { useAuth } from "@/lib/auth";
import { downloadCsv, stampFilename } from "@/lib/exportCsv";
import { PERM_LABELS } from "@/lib/permissions";

const tabs = ["Overview", "Activity Log", "Permissions", "Documents"];

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

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-[12px] font-semibold text-ink">{title}</h3>
      {action}
    </div>
  );
}

function ProfileSidebar({ profile, labels }: { profile: HospitalStaffProfile; labels: (typeof staffLabels)[HospitalStaffType] }) {
  return (
    <aside className="profile-sidebar lg:row-span-2 lg:self-start">
      <UserAvatar name={profile.fullName} photoUrl={profile.photoUrl} size={80} className="size-20 rounded-md text-[18px]" />
      <h2 className="mt-4 text-[14px] font-semibold">{profile.fullName}</h2>
      <p className="profile-sidebar-meta mt-1 text-[11px]">{profile.roleLabel ?? labels.singular}</p>
      <p className="profile-sidebar-meta text-[11px]">{profile.province || "—"}</p>
      <p className="profile-sidebar-meta text-[11px]">{profile.treatmentCenter}</p>
      <span
        className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          profile.status === "Active"
            ? "bg-status-green-soft text-status-green"
            : profile.status === "Pending"
              ? "bg-status-amber-soft text-status-amber"
              : "bg-elevated text-muted"
        }`}
      >
        {profile.status}
      </span>

      <div className="profile-sidebar-divider">
        {(
          [
            ["Email", profile.email],
            ["Phone", profile.phone],
            ["Joined Date", profile.joinedDate],
            ["Admin ID", profile.id],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <p className="profile-sidebar-label text-[10px]">{label}</p>
            <p className="profile-sidebar-value mt-0.5 break-all text-[11px]">{value}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function permissionRows(profile: HospitalStaffProfile) {
  if (profile.permissionCodes?.length) {
    return profile.permissionCodes.map((code) => ({
      code,
      label: PERM_LABELS[code] || code,
    }));
  }
  return profile.permissions.map((label, index) => ({
    code: `perm-${index}`,
    label,
  }));
}

function TabContent({ tab, profile, labels }: { tab: string; profile: HospitalStaffProfile; labels: (typeof staffLabels)[HospitalStaffType] }) {
  const granted = permissionRows(profile);

  if (tab === "Overview") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <article className="panel p-3">
          <CardHeader title="Personal Information" />
          <InfoRows
            items={[
              ["Full Name", profile.fullName],
              ["Date of Birth", profile.dateOfBirth ?? ""],
              ["Gender", profile.gender ?? ""],
              ["Address", profile.address ?? ""],
            ]}
          />
        </article>

        <article className="panel p-3">
          <CardHeader title="Account Information" />
          <InfoRows
            items={[
              ["Username", profile.username ?? ""],
              ["Email", profile.email],
              ["Phone", profile.phone],
              ["Role", profile.roleLabel ?? labels.singular],
              ["Status", profile.status],
            ]}
          />
        </article>

        <article className="panel p-3">
          <CardHeader title="Assigned Treatment Center" />
          <div className="mt-3 flex items-start gap-2 text-[11px] text-ink">
            <Building2 className="mt-0.5 size-3.5 shrink-0 text-brand" />
            <span>{profile.treatmentCenter}</span>
          </div>
          <InfoRows
            items={[
              ["Province", `${profile.province} Province`],
              ["Assigned Since", profile.joinedDate],
            ]}
          />
        </article>

        <article className="panel p-3">
          <CardHeader title="Patient app linkage" />
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Patients registered at this center appear in the admin panel with matching primary hospital. This staff
            account will add injections and treatments for those patients once clinical modules are enabled.
          </p>
        </article>

        <article className="panel p-3">
          <CardHeader title="Permissions" />
          <ul className="mt-3 space-y-2">
            {granted.map((perm) => (
              <li key={perm.code} className="flex items-center gap-2 text-[11px] text-ink">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-status-green-soft">
                  <Check className="size-2.5 text-status-green" />
                </span>
                {perm.label}
              </li>
            ))}
          </ul>
        </article>

        <article className="panel p-3">
          <h3 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
            <Shield className="size-3.5 text-brand" />
            Login & Security
          </h3>
          <InfoRows
            items={[
              ["Must change password", profile.mustChangePassword ? "Yes (first login)" : "No"],
              ["Last login", profile.lastLogin ?? "Never"],
            ]}
          />
        </article>
      </div>
    );
  }

  if (tab === "Permissions") {
    return (
      <article className="panel p-3">
        <CardHeader title={`Role: ${profile.roleLabel ?? labels.singular}`} />
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {granted.map((perm) => (
            <li key={perm.code} className="panel-inset flex items-center gap-2 px-2.5 py-2 text-[11px] text-ink shadow-none">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-status-green-soft">
                <Check className="size-2.5 text-status-green" />
              </span>
              {perm.label}
            </li>
          ))}
        </ul>
      </article>
    );
  }

  return (
    <article className="panel p-3">
      <CardHeader title={tab} />
      <p className="mt-3 text-[11px] text-muted">
        {tab === "Activity Log"
          ? "Activity logging will appear here when injection and audit modules are connected."
          : "Staff documents can be uploaded in a future release."}
      </p>
      {tab === "Documents" ? (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          <li className="panel-inset flex items-center gap-2 px-2.5 py-2 shadow-none">
            <FileText className="size-3.5 shrink-0 text-[#B9020A]" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-ink">No documents uploaded</p>
              <p className="text-[10px] text-faint">—</p>
            </div>
          </li>
        </ul>
      ) : null}
    </article>
  );
}

export default function HospitalStaffProfileView({ id, staffType }: { id: string; staffType: HospitalStaffType }) {
  const router = useRouter();
  const labels = staffLabels[staffType];
  const { user } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [profile, setProfile] = useState<HospitalStaffProfile | null>(null);
  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isSelf = isOwnStaffAccount(user, staff) || isOwnStaffAccount(user, profile);
  const canEditThis = Boolean(staff?.canEdit && !isSelf);

  function load() {
    return Promise.all([
      fetchHospitalStaffProfile(staffType, id),
      fetchStaffAccount(id).catch(() => null),
    ])
      .then(([hospitalProfile, staffRecord]) => {
        setStaff(staffRecord);
        setProfile({
          ...hospitalProfile,
          photoUrl: hospitalProfile.photoUrl || staffRecord?.photoUrl,
          permissionCodes: hospitalProfile.permissionCodes || staffRecord?.permissions,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"));
  }

  useEffect(() => {
    void load();
  }, [id, staffType]);

  async function setAccountStatus(status: "Active" | "Inactive") {
    if (!staff) return;
    setBusy(true);
    setError("");
    try {
      const data = await updateStaffAccount(staff.id, { status });
      const updated = data.admin ?? data.staff;
      setStaff(updated);
      setProfile((current) => (current ? { ...current, status: updated.status } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <p className="text-[11px] text-red-600">{error}</p>;
  }

  if (!profile) {
    return <p className="text-[11px] text-muted">Loading profile…</p>;
  }

  const isOverview = tab === "Overview";
  const scopeLabel = profile.treatmentCenter
    ? `${profile.treatmentCenter} · ${profile.province}`
    : profile.province || "—";

  return (
    <div className="admin-page admin-page--fill">
      <div className="admin-profile-sticky space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[16px] font-semibold text-ink">{labels.singular} Profile</h1>
          <p className="text-[11px] text-muted">
            Home &gt; Hospital Administration &gt;{" "}
            <Link href={labels.profilePath} className="hover:text-brand">
              {labels.crumb}
            </Link>{" "}
            &gt; {labels.singular} Profile
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
                Edit Admin
              </button>
              {staff?.status === "Pending" ? (
                <button
                  type="button"
                  disabled={busy}
                  className="rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                  onClick={() => void setAccountStatus("Active")}
                >
                  Mark as Active
                </button>
              ) : staff?.status === "Inactive" ? (
                <button
                  type="button"
                  disabled={busy}
                  className="panel px-3 py-1.5 text-[11px] font-medium text-ink shadow-none disabled:opacity-60"
                  onClick={() => void setAccountStatus("Active")}
                >
                  Activate
                </button>
              ) : staff?.status === "Active" ? (
                <button
                  type="button"
                  disabled={busy}
                  className="panel px-3 py-1.5 text-[11px] font-medium text-ink shadow-none disabled:opacity-60"
                  onClick={() => void setAccountStatus("Inactive")}
                >
                  Deactivate
                </button>
              ) : null}
            </>
          ) : null}
          {staff?.canDelete && staff.userId !== user?.id ? (
            <button
              type="button"
              className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-red-600 shadow-none"
              onClick={() => {
                if (!window.confirm(`Delete ${labels.singular} ${profile.id}? This cannot be undone.`)) return;
                void deleteStaffAccount(profile.id)
                  .then(() => router.push(labels.profilePath))
                  .catch((err: Error) => setError(err.message || "Could not delete admin"));
              }}
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          ) : null}
          <ActionsMenu
            ariaLabel={`More ${labels.singular.toLowerCase()} actions`}
            buttonClassName="panel p-1.5 shadow-none"
            iconClassName="size-3.5"
            items={[
              { label: "Copy staff ID", onClick: () => void copyText(profile.id) },
              { label: "Copy email", onClick: () => void copyText(profile.email) },
              {
                label: "Copy username",
                onClick: () => void copyText(profile.username || staff?.username || ""),
                hidden: !profile.username && !staff?.username,
              },
              {
                label: "Export profile",
                onClick: () =>
                  downloadCsv(
                    stampFilename(`${labels.singular.replaceAll(" ", "-").toLowerCase()}-${profile.id}`),
                    ["Field", "Value"],
                    [
                      ["ID", profile.id],
                      ["Name", profile.fullName],
                      ["Role", profile.roleLabel || labels.singular],
                      ["Email", profile.email],
                      ["Phone", profile.phone || ""],
                      ["Status", profile.status],
                      ["Province", profile.province],
                      ["Center", profile.treatmentCenter],
                    ],
                  ),
              },
              { label: "View permissions", onClick: () => setTab("Permissions") },
              { label: "View activity log", onClick: () => setTab("Activity Log") },
              {
                label: "Mark as Active",
                hidden: !canEditThis || staff?.status !== "Pending",
                onClick: () => void setAccountStatus("Active"),
              },
              {
                label: "Deactivate account",
                hidden: !canEditThis || staff?.status !== "Active",
                onClick: () => void setAccountStatus("Inactive"),
              },
              {
                label: "Activate account",
                hidden: !canEditThis || staff?.status !== "Inactive",
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
          <p className="text-[13px] font-semibold text-ink">{profile.province || "—"}</p>
        </div>
        <div className="h-8 w-px bg-line-subtle" />
        <div>
          <p className="text-[10px] uppercase tracking-wide text-faint">Treatment center</p>
          <p className="text-[13px] font-semibold text-ink">{profile.treatmentCenter || "—"}</p>
        </div>
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
        {isOverview ? <ProfileSidebar profile={profile} labels={labels} /> : null}

        <div className="min-w-0">
          <TabContent tab={tab} profile={profile} labels={labels} />
        </div>
      </div>
      </div>
      {editing && canEditThis && staff ? (
        <StaffAccountForm
          mode="edit"
          lockedKind={staffType}
          initial={staff}
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
