"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Shield } from "lucide-react";

import { OwnAvatar } from "@/components/ui/UserAvatar";
import { KIND_LABELS, type StaffKind } from "@/features/admins/api";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { PERM_LABELS } from "@/lib/permissions";

type Profile = {
  id: string;
  fullName: string;
  roleLabel: string;
  kind: string;
  email: string;
  phone: string;
  username: string;
  designation: string;
  nationalId: string;
  officeAddress: string;
  province: string;
  treatmentCenter: string;
  status: string;
  lastLogin: string;
  joinedDate: string;
  photoUrl?: string;
  passwordExpiresAt?: string;
  permissionLabels?: Array<{ code: string; label: string }>;
};

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

export default function MyProfileModule() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void apiFetch("/auth/me/profile/")
      .then((data) => setProfile((data as { profile?: Profile }).profile ?? null))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load profile"));
  }, []);

  if (error && !profile) return <p className="p-4 text-[12px] text-red-600">{error}</p>;
  if (!profile) return <p className="p-4 text-[12px] text-muted">Loading your profile…</p>;

  const roleLabel = KIND_LABELS[profile.kind as StaffKind] || profile.roleLabel;
  const scopeLabel = profile.treatmentCenter
    ? `${profile.treatmentCenter} · ${profile.province}`
    : profile.province || "National";
  const permissions = profile.permissionLabels?.length
    ? profile.permissionLabels
    : (user?.permissions || []).map((code) => ({ code, label: PERM_LABELS[code] || code }));

  return (
    <div className="flex flex-col gap-3 pb-6">
      <div>
        <h1 className="text-[16px] font-semibold text-ink">My profile</h1>
        <p className="text-[11px] text-muted">Home &gt; My profile · read-only (photo can be updated)</p>
      </div>

      <section className="panel p-4">
        <div className="flex flex-wrap items-start gap-4">
          <OwnAvatar name={profile.fullName} photoUrl={profile.photoUrl || user?.photoUrl} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-ink">{profile.fullName}</h2>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">{profile.status}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-brand">{profile.id}</p>
            <p className="mt-1 text-[11px] text-muted">{roleLabel} · {scopeLabel}</p>
            <p className="mt-2 text-[11px] text-muted">
              To change your password, use{" "}
              <Link href="/change-password" className="font-semibold text-brand hover:underline">
                change password
              </Link>
              . Other details can only be updated by another administrator.
            </p>
          </div>
          <Link
            href="/change-password"
            className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-ink shadow-none hover:bg-elevated"
          >
            <KeyRound className="size-3.5" />
            Change password
          </Link>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="panel p-4">
          <h3 className="text-[13px] font-semibold text-ink">Account</h3>
          <InfoRows
            items={[
              ["Admin ID", profile.id],
              ["Username", profile.username],
              ["Email", profile.email],
              ["Phone", profile.phone],
              ["Last login", profile.lastLogin],
              ["Joined", profile.joinedDate],
              ["Password renew by", profile.passwordExpiresAt ? new Date(profile.passwordExpiresAt).toLocaleDateString("en-GB") : "—"],
            ]}
          />
        </section>

        <section className="panel p-4">
          <h3 className="text-[13px] font-semibold text-ink">Work details</h3>
          <InfoRows
            items={[
              ["Role", roleLabel],
              ["Designation", profile.designation],
              ["National ID", profile.nationalId],
              ["Province", profile.province],
              ["Centre", profile.treatmentCenter],
              ["Office address", profile.officeAddress],
            ]}
          />
        </section>
      </div>

      <section className="panel p-4">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-brand" />
          <h3 className="text-[13px] font-semibold text-ink">Permissions</h3>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {permissions.map((item) => (
            <span key={item.code} className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium text-ink">
              {item.label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
