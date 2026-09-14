"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Droplets, MapPin, MoreHorizontal, Pencil, UserRound } from "lucide-react";

import { UserAvatar } from "@/components/ui/UserAvatar";
import type { PatientRecord } from "@/features/patients/types";
import { PatientInjectionsPanel, PatientTreatmentsPanel } from "@/features/injections/components/PatientClinicalPanels";
import { PatientBleedingPanel } from "@/features/patients/components/PatientBleedingPanel";
import PatientDocumentsPanel from "@/features/patients/components/PatientDocumentsPanel";
import { fetchStockMovements, type StockMovementRow } from "@/features/stock/api";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

const tabs = ["Overview", "Treatment History", "Injections", "Bleeding Episodes", "Medicines / Stock", "Documents", "Notes"];

function InfoGrid({ items }: { items: [string, string][] }) {
  return (
    <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[11px] text-muted">{label}</dt>
          <dd className="mt-0.5 text-[12px] font-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ageFromDob(dob: string) {
  if (!dob) return 0;
  const born = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

export default function PatientProfileView({ id }: { id: string }) {
  const router = useRouter();
  const { can } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [record, setRecord] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    void apiFetch(`/patients/${id}/`)
      .then((data) => {
        if (data?.patient) setRecord(data.patient as PatientRecord);
        else setError("Patient not found.");
      })
      .catch((err: Error) => {
        setRecord(null);
        setError(err.message || "You cannot view this patient.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function setVerification(action: "verify" | "reject") {
    setBusy(true);
    setActionError("");
    try {
      const reason = action === "reject" ? window.prompt("Rejection reason (optional)") ?? "" : "";
      const data = await apiFetch(`/patients/${id}/${action}/`, {
        method: "PUT",
        body: JSON.stringify(action === "reject" ? { reason } : {}),
      });
      if (data?.patient) setRecord(data.patient as PatientRecord);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update verification");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="p-4 text-[12px] text-muted">Loading patient {id}…</p>;
  if (error || !record) return <p className="p-4 text-[12px] text-red-600">{error || "Patient not found."}</p>;

  const age = ageFromDob(record.dateOfBirth);
  const registered = record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "—";
  const lastVisit = record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : "—";

  return (
    <div className="flex flex-col gap-3 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Patient Profile</h1>
          <p className="text-[10px] text-muted">
            Home &gt; Patients Management &gt;{" "}
            <Link href="/dashboard/patients" className="hover:text-brand">
              All Patients
            </Link>{" "}
            &gt; Patient Profile
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {can(Perm.patientsVerify) && record.status !== "Active" ? (
            <button
              type="button"
              disabled={busy}
              className="rounded bg-status-green px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-60"
              onClick={() => void setVerification("verify")}
            >
              Verify
            </button>
          ) : null}
          {can(Perm.patientsVerify) && record.status !== "Rejected" ? (
            <button
              type="button"
              disabled={busy}
              className="rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-60"
              onClick={() => void setVerification("reject")}
            >
              Reject
            </button>
          ) : null}
          {can(Perm.patientsUpdate) ? (
            <button
              type="button"
              className="panel flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-ink shadow-none"
              onClick={() => router.push(`/dashboard/patients/${id}/edit`)}
            >
              <Pencil className="size-3" />
              Edit Patient
            </button>
          ) : null}
          <button type="button" className="panel p-1.5 shadow-none" aria-label="More">
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </div>
      {actionError ? <p className="text-[11px] text-red-600">{actionError}</p> : null}

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

      {tab === "Overview" ? (
        <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
          <article className="panel flex h-full flex-col p-3">
            <div className="flex flex-col items-center text-center">
              {record.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.photoUrl}
                  alt={record.fullName}
                  width={72}
                  height={72}
                  className="size-[72px] rounded-full object-cover ring-2 ring-brand-soft"
                />
              ) : (
                <UserAvatar name={record.fullName} size={72} className="size-[72px] text-[20px] ring-2 ring-brand-soft" />
              )}
              <p className="mt-2 text-[10px] font-semibold text-brand">{record.id}</p>
              <h2 className="text-[14px] font-semibold text-ink">{record.fullName}</h2>
              <span
                className={`mt-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  record.status === "Active"
                    ? "bg-status-green-soft text-status-green"
                    : record.status === "Rejected"
                      ? "bg-red-50 text-red-600"
                      : "bg-status-amber-soft text-status-amber"
                }`}
              >
                {record.status}
              </span>
            </div>
            <ul className="mt-3 space-y-2 text-[11px] text-muted">
              <li className="flex items-center gap-1.5">
                <UserRound className="size-3 shrink-0 text-brand" />
                {record.gender} | {age} Years
              </li>
              <li className="flex items-center gap-1.5">
                <Droplets className="size-3 shrink-0 text-[#B9020A]" />
                {record.bloodGroup} Blood Group
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="size-3 shrink-0 text-brand" />
                {record.district}, {record.province}
              </li>
              <li className="flex items-center gap-1.5">
                <CalendarDays className="size-3 shrink-0 text-brand" />
                Registered {registered}
              </li>
              <li className="flex items-center gap-1.5">
                <CalendarDays className="size-3 shrink-0 text-brand" />
                Last Visit {lastVisit}
              </li>
            </ul>
          </article>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <article className="panel p-3">
              <h3 className="text-[11px] font-semibold text-ink">Personal Information</h3>
              <InfoGrid
                items={[
                  ["Date of Birth", record.dateOfBirth],
                  ["Gender", record.gender],
                  ["Phone", record.mobile],
                  ["Email", record.email || "—"],
                  ["Nationality", "Nepali"],
                  ["Address", record.address],
                ]}
              />
            </article>

            <article className="panel p-3">
              <h3 className="text-[11px] font-semibold text-ink">Diagnosis & Treatment</h3>
              <InfoGrid
                items={[
                  ["Diagnosis", `Hemophilia ${record.hemophiliaType} (${record.severity})`],
                  ["Factor Level", `${record.baselineFactorLevel}% ${record.deficientFactor}`],
                  ["Treatment Plan", record.treatmentPlan || (record.inhibitorStatus === "Current" ? "Bypassing / Specialist" : "Regular Prophylaxis")],
                  ["Prescribed Factor", record.prescribedFactorMedicineName || record.deficientFactor],
                  ["Deficient Factor", record.deficientFactor],
                  ["Inhibitor", record.inhibitorStatus],
                ]}
              />
            </article>

            <PatientInjectionsPanel
              patientId={id}
              hemophiliaType={record.hemophiliaType}
              primaryHospital={record.primaryHospital}
              compact
              onViewAll={() => setTab("Injections")}
            />

            <PatientBleedingPanel patientId={id} primaryHospital={record.primaryHospital} compact />

            <div className="md:col-span-2">
              <PatientDocumentsPanel
                patientId={id}
                primaryHospital={record.primaryHospital}
                compact
                onViewAll={() => setTab("Documents")}
              />
            </div>
          </div>
        </div>
      ) : null}
      {tab === "Documents" ? (
        <PatientDocumentsPanel patientId={id} primaryHospital={record.primaryHospital} />
      ) : tab === "Injections" ? (
        <PatientInjectionsPanel patientId={id} hemophiliaType={record.hemophiliaType} primaryHospital={record.primaryHospital} />
      ) : tab === "Treatment History" ? (
        <div className="flex flex-col gap-2">
          <p className="rounded border border-line-subtle bg-elevated px-3 py-2 text-[11px] text-muted">
            <span className="font-semibold text-ink">Treatment History</span> records non-injection care events
            (physiotherapy, surgery, admission, ITI, counseling). Use the{" "}
            <span className="font-semibold text-ink">Injections</span> tab to log factor doses — those update stock
            and appear in the patient app injection history.
          </p>
          <PatientTreatmentsPanel patientId={id} primaryHospital={record.primaryHospital} />
        </div>
      ) : tab === "Bleeding Episodes" ? (
        <PatientBleedingPanel patientId={id} primaryHospital={record.primaryHospital} />
      ) : tab === "Medicines / Stock" ? (
        <PatientDoseStockPanel patientId={id} />
      ) : tab !== "Overview" ? (
        <article className="panel p-3 text-[11px] text-muted">
          {tab} records for {record.fullName} will appear here.
        </article>
      ) : null}
    </div>
  );
}

function PatientDoseStockPanel({ patientId }: { patientId: string }) {
  const [rows, setRows] = useState<StockMovementRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetchStockMovements({ patientId })
      .then((data) => setRows(data.movements ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <article className="panel overflow-x-auto p-3">
      <h3 className="text-[11px] font-semibold text-ink">Doses taken from stock</h3>
      <p className="mt-1 text-[10px] text-muted">Each completed injection automatically decrements that center&apos;s inventory.</p>
      <table className="inner-table mt-2 w-full text-left">
        <thead className="text-[11px] uppercase text-faint">
          <tr>
            {["When", "Product", "Qty", "Center", "By", "Reason"].map((h) => (
              <th key={h} className="px-2 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="px-2 py-3 text-[11px] text-muted">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-2 py-3 text-[11px] text-muted">
                No stock movements for this patient yet.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-2 text-[10px]">{row.recordedAt ? new Date(row.recordedAt).toLocaleString() : ""}</td>
                <td className="px-2 py-2 text-[11px]">{row.factorMedicineName}</td>
                <td className="px-2 py-2 text-[11px]">
                  {row.quantityDelta} {row.unit}
                </td>
                <td className="px-2 py-2 text-[11px]">{row.hospitalName}</td>
                <td className="px-2 py-2 text-[10px]">{row.recordedBy?.name}</td>
                <td className="px-2 py-2 text-[11px]">{row.reason}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </article>
  );
}
