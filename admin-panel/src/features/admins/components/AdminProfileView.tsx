"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, MoreHorizontal, Shield } from "lucide-react";

import { fetchProvinceAdmin, updateProvinceAdmin, type ProvinceAdminRecord } from "@/features/admins/api";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

const tabs = ["Overview", "Roles & Permissions"];

const provinceCapabilities = [
  "Verify and manage patients in own province",
  "Create and update patient registry records",
  "Manage hospitals and hospital staff in own province",
  "Monitor injections and treatments (read-only)",
  "View province and hospital reports",
  "Cannot add injections or treatments",
  "Cannot view national audit logs",
];

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
  const { can } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [admin, setAdmin] = useState<ProvinceAdminRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchProvinceAdmin(id)
      .then(setAdmin)
      .catch((err) => setError(err instanceof Error ? err.message : "Admin not found"));
  }, [id]);

  async function toggleStatus() {
    if (!admin) return;
    setBusy(true);
    try {
      const data = await updateProvinceAdmin(admin.id, {
        status: admin.status === "Active" ? "Inactive" : "Active",
      });
      setAdmin(data.admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  }

  if (error && !admin) return <p className="p-4 text-[12px] text-red-600">{error}</p>;
  if (!admin) return <p className="p-4 text-[12px] text-muted">Loading {id}…</p>;

  const isOverview = tab === "Overview";

  return (
    <div className="flex flex-col gap-3 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[16px] font-semibold text-ink">Admin Profile</h1>
          <p className="text-[11px] text-muted">
            Home &gt; Admin Management &gt;{" "}
            <Link href="/dashboard/admins" className="hover:text-brand">
              Province Admins
            </Link>{" "}
            &gt; {admin.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can(Perm.provinceAdminsManage) ? (
            <button
              type="button"
              disabled={busy}
              className="panel px-3 py-1.5 text-[11px] font-medium text-ink shadow-none disabled:opacity-60"
              onClick={() => void toggleStatus()}
            >
              {admin.status === "Active" ? "Deactivate" : "Activate"}
            </button>
          ) : null}
          <button type="button" className="panel p-1.5 shadow-none" aria-label="More">
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </div>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}

      <div
        className={
          isOverview
            ? "grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)] lg:grid-rows-[auto_1fr]"
            : "flex flex-col gap-3"
        }
      >
        {isOverview ? (
          <aside className="profile-sidebar lg:row-span-2 lg:self-start">
            <Image
              src="/patient-ravi.jpg"
              alt={admin.fullName}
              width={80}
              height={80}
              className="size-20 rounded-md object-cover"
            />
            <h2 className="mt-4 text-[14px] font-semibold">{admin.fullName}</h2>
            <p className="profile-sidebar-meta mt-1 text-[11px]">Province Admin</p>
            <p className="profile-sidebar-meta text-[11px]">{admin.province} Province</p>
            <span
              className={`mt-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                admin.status === "Active" ? "bg-status-green-soft text-status-green" : "bg-elevated text-muted"
              }`}
            >
              {admin.status}
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
          {tab === "Overview" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <article className="panel p-3">
                <h3 className="text-[12px] font-semibold text-ink">Account Information</h3>
                <InfoRows
                  items={[
                    ["Full Name", admin.fullName],
                    ["Email", admin.email],
                    ["Role", "Province Admin"],
                    ["Status", admin.status],
                    ["Must change password", admin.mustChangePassword ? "Yes" : "No"],
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
                    ["Province", admin.province],
                    ["National reports", "No"],
                    ["Audit logs", "No"],
                    ["Add injections", "No — read-only monitor"],
                  ]}
                />
              </article>
            </div>
          ) : (
            <article className="panel p-3">
              <h3 className="text-[12px] font-semibold text-ink">Role: Province Admin</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {provinceCapabilities.map((perm) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
