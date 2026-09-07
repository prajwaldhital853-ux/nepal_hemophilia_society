"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, Check, FileText, MoreHorizontal, Pencil, Shield } from "lucide-react";

import { fetchHospitalStaffProfile } from "@/features/hospitals/api";
import { staffLabels, type HospitalStaffProfile, type HospitalStaffType } from "@/features/hospitals/types";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

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
      <Image
        src="/patient-ravi.jpg"
        alt={profile.fullName}
        width={80}
        height={80}
        className="size-20 rounded-md object-cover"
      />
      <h2 className="mt-4 text-[14px] font-semibold">{profile.fullName}</h2>
      <p className="profile-sidebar-meta mt-1 text-[11px]">{profile.roleLabel ?? labels.singular}</p>
      <p className="profile-sidebar-meta text-[11px]">{profile.treatmentCenter}</p>
      <span className="mt-3 inline-block rounded-full bg-status-green-soft px-2 py-0.5 text-[10px] font-semibold text-status-green">
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

function TabContent({ tab, profile, labels }: { tab: string; profile: HospitalStaffProfile; labels: (typeof staffLabels)[HospitalStaffType] }) {
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
            {profile.permissions.map((perm) => (
              <li key={perm} className="flex items-center gap-2 text-[11px] text-ink">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-status-green-soft">
                  <Check className="size-2.5 text-status-green" />
                </span>
                {perm}
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
          {profile.permissions.map((perm) => (
            <li key={perm} className="panel-inset flex items-center gap-2 px-2.5 py-2 text-[11px] text-ink shadow-none">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-status-green-soft">
                <Check className="size-2.5 text-status-green" />
              </span>
              {perm}
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
  const labels = staffLabels[staffType];
  const { can } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [profile, setProfile] = useState<HospitalStaffProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchHospitalStaffProfile(staffType, id)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"));
  }, [id, staffType]);

  if (error) {
    return <p className="text-[11px] text-red-600">{error}</p>;
  }

  if (!profile) {
    return <p className="text-[11px] text-muted">Loading profile…</p>;
  }

  const isOverview = tab === "Overview";

  return (
    <div className="flex flex-col gap-3 pb-6">
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
          {can(Perm.hospitalStaffManage) ? (
            <button type="button" className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-ink shadow-none">
              <Pencil className="size-3.5" />
              Edit Admin
            </button>
          ) : null}
          <button type="button" className="panel p-1.5 shadow-none" aria-label="More">
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </div>

      <div
        className={
          isOverview
            ? "grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:grid-rows-[auto_1fr]"
            : "flex flex-col gap-3"
        }
      >
        {isOverview ? <ProfileSidebar profile={profile} labels={labels} /> : null}

        <div className={`tabs-bar min-w-0 ${isOverview ? "lg:col-start-2" : ""}`}>
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

        <div className={`min-w-0 ${isOverview ? "lg:col-start-2" : ""}`}>
          <TabContent tab={tab} profile={profile} labels={labels} />
        </div>
      </div>
    </div>
  );
}
