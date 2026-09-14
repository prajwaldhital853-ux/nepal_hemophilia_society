"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";

import {
  fetchPatientDocuments,
  uploadPatientDocuments,
  type PatientDocumentRow,
} from "@/features/patients/documentsApi";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

type Props = {
  patientId: string;
  primaryHospital?: string;
  compact?: boolean;
  onViewAll?: () => void;
};

function formatWhen(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export default function PatientDocumentsPanel({ patientId, primaryHospital = "", compact, onViewAll }: Props) {
  const { can, user } = useAuth();
  const canAdd = can(Perm.documentsAdd);
  const [rows, setRows] = useState<PatientDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [center, setCenter] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPatientDocuments(patientId, {
        center: compact ? undefined : center,
        search: compact ? undefined : search,
        from: compact ? undefined : from,
        to: compact ? undefined : to,
      });
      setRows(data.documents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load documents");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [patientId, center, search, from, to, compact]);

  useEffect(() => {
    void load();
  }, [load]);

  const centers = useMemo(() => {
    const names = new Set(rows.map((row) => row.hospitalName || row.center).filter(Boolean) as string[]);
    if (primaryHospital) names.add(primaryHospital);
    return ["All", ...Array.from(names)];
  }, [rows, primaryHospital]);

  const visible = compact ? rows.slice(0, 4) : rows;

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      await uploadPatientDocuments(patientId, Array.from(files), user?.hospitalStaff?.treatmentCenter || primaryHospital);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload document");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="panel p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold text-ink">Diagnostic documents</h3>
        <div className="flex items-center gap-2">
          {compact && rows.length > 4 && onViewAll ? (
            <button type="button" onClick={onViewAll} className="text-[10px] font-semibold text-brand">
              See more
            </button>
          ) : null}
          {canAdd ? (
            <label className="flex cursor-pointer items-center gap-1 rounded bg-brand px-2 py-1 text-[10px] font-semibold text-white">
              <Plus className="size-3" />
              {busy ? "Uploading…" : "Add document"}
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png"
                multiple
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  void onPickFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          ) : null}
        </div>
      </div>

      {!compact ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <label className="relative text-[11px] sm:col-span-2">
            <Search className="pointer-events-none absolute left-2 top-2.5 size-3.5 text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onBlur={() => void load()}
              placeholder="Search by name"
              className="w-full rounded border border-line-subtle bg-elevated py-1.5 pl-7 pr-2 text-[12px] outline-none"
            />
          </label>
          <select value={center} onChange={(e) => setCenter(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1.5 text-[12px]">
            {centers.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All centers" : item}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-1">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1.5 text-[11px]" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1.5 text-[11px]" />
          </div>
          <button type="button" onClick={() => void load()} className="rounded border border-line px-2 py-1 text-[10px] font-semibold text-muted sm:col-span-4">
            Apply filters
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}

      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {loading ? (
          <li className="text-[11px] text-muted">Loading documents…</li>
        ) : visible.length === 0 ? (
          <li className="text-[11px] text-muted">No diagnostic documents uploaded yet.</li>
        ) : (
          visible.map((doc) => (
            <li key={doc.id || doc.url || doc.name} className="panel-inset flex items-start gap-2 px-2.5 py-2 shadow-none">
              <FileText className="mt-0.5 size-3.5 shrink-0 text-[#B9020A]" />
              <div className="min-w-0">
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noreferrer" className="truncate text-[11px] font-medium text-brand">
                    {doc.name}
                  </a>
                ) : (
                  <p className="truncate text-[11px] font-medium text-ink">{doc.name}</p>
                )}
                <p className="text-[10px] text-faint">
                  {doc.hospitalName || "Center not recorded"} · {formatWhen(doc.uploadedAt)}
                </p>
                <p className="text-[10px] text-muted">
                  Added by {doc.uploadedBy || "staff"}
                  {doc.uploadedByRole ? ` (${doc.uploadedByRole.replaceAll("_", " ")})` : ""}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </article>
  );
}
