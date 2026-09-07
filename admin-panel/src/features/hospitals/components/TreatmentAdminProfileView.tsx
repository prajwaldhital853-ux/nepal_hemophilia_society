"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Check,
  FileText,
  MoreHorizontal,
  Pencil,
  Shield,
} from "lucide-react";

import {
  allTreatmentAdmins,
  treatmentAdminProfile,
} from "@/features/hospitals/data/mockTreatmentAdmins";

const tabs = ["Overview", "Activity Log", "Permissions", "Documents"];

type Profile = typeof treatmentAdminProfile & { id: string; name: string };

function InfoRows({ items }: { items: [string, string][] }) {
  return (
    <dl className="mt-3 space-y-2.5">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 text-[11px]">
          <dt className="shrink-0 text-muted">{label}</dt>
          <dd className="text-right font-medium text-ink">{value}</dd>
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

function ProfileSidebar({ profile }: { profile: Profile }) {
  return (
    <aside className="profile-sidebar lg:row-span-2 lg:self-start">
      <Image
        src="/patient-ravi.jpg"
        alt={profile.name}
        width={80}
        height={80}
        className="size-20 rounded-md object-cover"
      />
      <h2 className="mt-4 text-[14px] font-semibold">{profile.name}</h2>
      <p className="profile-sidebar-meta mt-1 text-[11px]">{profile.role}</p>
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

function TabContent({ tab, profile }: { tab: string; profile: Profile }) {
  if (tab === "Overview") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <article className="panel p-3">
          <CardHeader title="Personal Information" />
          <InfoRows
            items={[
              ["Full Name", profile.name],
              ["Date of Birth", profile.dob],
              ["Gender", profile.gender],
              ["Address", profile.address],
            ]}
          />
        </article>

        <article className="panel p-3">
          <CardHeader title="Account Information" />
          <InfoRows
            items={[
              ["Email", profile.email],
              ["Phone", profile.phone],
              ["Role", profile.role],
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
              ["Center Code", "KTM-HC-001"],
              ["Assigned Since", profile.joinedDate],
            ]}
          />
        </article>

        <article className="panel p-3">
          <CardHeader
            title="Recent Activities"
            action={
              <button type="button" className="text-[11px] font-medium text-brand">
                View All
              </button>
            }
          />
          <ul className="stack-divider mt-3">
            {profile.recentActivities.map((item) => (
              <li key={item.title} className="flex items-center justify-between gap-2 py-2.5 text-[11px]">
                <span className="text-ink">{item.title}</span>
                <span className="shrink-0 text-muted">{item.time}</span>
              </li>
            ))}
          </ul>
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
          <dl className="mt-3 space-y-2.5">
            <div className="flex items-start justify-between gap-4 text-[11px]">
              <dt className="text-muted">Two-Factor Authentication</dt>
              <dd className="font-medium text-status-green">{profile.security.twoFactor}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 text-[11px]">
              <dt className="text-muted">Password Last Changed</dt>
              <dd className="text-right font-medium text-ink">{profile.security.passwordChanged}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 text-[11px]">
              <dt className="text-muted">Last Login</dt>
              <dd className="text-right font-medium text-ink">{profile.security.lastLogin}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 text-[11px]">
              <dt className="text-muted">Login Attempts</dt>
              <dd className="text-right font-medium text-ink">{profile.security.loginAttempts}</dd>
            </div>
          </dl>
        </article>
      </div>
    );
  }

  if (tab === "Activity Log") {
    return (
      <article className="panel p-3">
        <CardHeader title="Activity Log" />
        <ul className="stack-divider mt-3">
          {profile.recentActivities.map((item) => (
            <li key={item.title} className="flex items-center justify-between py-2.5 text-[11px]">
              <span className="text-ink">{item.title}</span>
              <span className="text-muted">{item.time}</span>
            </li>
          ))}
        </ul>
      </article>
    );
  }

  if (tab === "Permissions") {
    return (
      <article className="panel p-3">
        <CardHeader title={`Role: ${profile.role}`} />
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {profile.permissions.map((perm) => (
            <li
              key={perm}
              className="panel-inset flex items-center gap-2 px-2.5 py-2 text-[11px] text-ink shadow-none"
            >
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
      <CardHeader title="Documents" />
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {profile.documents.map((doc) => (
          <li key={doc.name} className="panel-inset flex items-center gap-2 px-2.5 py-2 shadow-none">
            <FileText className="size-3.5 shrink-0 text-[#B9020A]" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-ink">{doc.name}</p>
              <p className="text-[10px] text-faint">{doc.date}</p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function TreatmentAdminProfileView({ id }: { id: string }) {
  const [tab, setTab] = useState("Overview");
  const row = allTreatmentAdmins.find((a) => a.id === id);
  const profile = {
    ...treatmentAdminProfile,
    id,
    name: row?.name ?? treatmentAdminProfile.name,
    treatmentCenter: row?.treatmentCenter ?? treatmentAdminProfile.treatmentCenter,
    province: row?.province ?? treatmentAdminProfile.province,
    status: row?.status ?? treatmentAdminProfile.status,
    email: row?.email ?? treatmentAdminProfile.email,
    phone: row?.phone ?? treatmentAdminProfile.phone,
    joinedDate: row?.joinedDate ?? treatmentAdminProfile.joinedDate,
  };

  const isOverview = tab === "Overview";

  return (
    <div className="flex flex-col gap-3 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[16px] font-semibold text-ink">Treatment Admin Profile</h1>
          <p className="text-[11px] text-muted">
            Home &gt; Hospital Administration &gt;{" "}
            <Link href="/dashboard/hospitals/treatment-admins" className="hover:text-brand">
              Treatment Admin
            </Link>{" "}
            &gt; Treatment Admin Profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-ink shadow-none"
          >
            <Pencil className="size-3.5" />
            Edit Admin
          </button>
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
        {isOverview ? <ProfileSidebar profile={profile} /> : null}

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
          <TabContent tab={tab} profile={profile} />
        </div>
      </div>
    </div>
  );
}
