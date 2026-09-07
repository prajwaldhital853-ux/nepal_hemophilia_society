"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Droplets, FileText, MapPin, MoreHorizontal, Pencil, UserRound } from "lucide-react";

import type { PatientRecord } from "@/features/patients/types";
import { PatientInjectionsPanel, PatientTreatmentsPanel } from "@/features/injections/components/PatientClinicalPanels";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

const tabs = ["Overview", "Treatment History", "Injections", "Medicines / Stock", "Documents", "Notes"];

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
                <Image
                  src="/patient-ravi.jpg"
                  alt={record.fullName}
                  width={72}
                  height={72}
                  className="size-[72px] rounded-full object-cover ring-2 ring-brand-soft"
                />
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
                  ["Treatment Plan", record.inhibitorStatus === "Current" ? "Bypassing / specialist plan" : "Regular Prophylaxis"],
                  ["Factor Used", record.deficientFactor],
                  ["Inhibitor", record.inhibitorStatus],
                ]}
              />
            </article>

            <PatientInjectionsPanel
              patientId={id}
              hemophiliaType={record.hemophiliaType}
              compact
              onViewAll={() => setTab("Injections")}
            />

            <article className="panel p-3 md:col-span-2">
              <h3 className="text-[11px] font-semibold text-ink">Documents</h3>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {(record.documents?.length ? record.documents : []).map((doc) => (
                  <li key={doc.url || doc.name} className="panel-inset flex items-center gap-2 px-2.5 py-2 shadow-none">
                    <FileText className="size-3.5 shrink-0 text-[#B9020A]" />
                    <div className="min-w-0">
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="truncate text-[11px] font-medium text-brand">
                          {doc.name}
                        </a>
                      ) : (
                        <p className="truncate text-[11px] font-medium text-ink">{doc.name}</p>
                      )}
                      <p className="text-[10px] text-faint">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ""}</p>
                    </div>
                  </li>
                ))}
                {!record.documents?.length ? (
                  <li className="text-[11px] text-muted">No diagnostic documents uploaded yet.</li>
                ) : null}
              </ul>
            </article>
          </div>
        </div>
      ) : null}
      {tab === "Documents" ? (
        <article className="panel p-3">
          <h3 className="text-[11px] font-semibold text-ink">Diagnostic documents</h3>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {(record.documents ?? []).map((doc) => (
              <li key={doc.url || doc.name} className="panel-inset flex items-center gap-2 px-2.5 py-2 shadow-none">
                <FileText className="size-3.5 shrink-0 text-[#B9020A]" />
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noreferrer" className="text-[11px] font-medium text-brand">
                    {doc.name}
                  </a>
                ) : (
                  <span className="text-[11px]">{doc.name}</span>
                )}
              </li>
            ))}
            {!record.documents?.length ? <li className="text-[11px] text-muted">No documents on file.</li> : null}
          </ul>
        </article>
      ) : tab === "Injections" ? (
        <PatientInjectionsPanel patientId={id} hemophiliaType={record.hemophiliaType} />
      ) : tab === "Treatment History" ? (
        <PatientTreatmentsPanel patientId={id} />
      ) : tab !== "Overview" ? (
        <article className="panel p-3 text-[11px] text-muted">
          {tab} records for {record.fullName} will appear here.
        </article>
      ) : null}
    </div>
  );
}
