"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import {
  fetchPatientInjections,
  fetchPatientTreatments,
  statusClass,
  updateInjection,
  updateTreatment,
  type ApiInjection,
  type ApiTreatment,
  INJECTION_STATUSES,
} from "@/features/injections/api";
import LogInjectionDialog from "@/features/injections/components/LogInjectionDialog";
import LogTreatmentDialog from "@/features/injections/components/LogTreatmentDialog";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

function StatusSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (status: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold outline-none ${statusClass(value as ApiInjection["status"])}`}
    >
      {INJECTION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function PatientInjectionsPanel({
  patientId,
  hemophiliaType,
  compact = false,
  onViewAll,
}: {
  patientId: string;
  hemophiliaType?: string;
  compact?: boolean;
  onViewAll?: () => void;
}) {
  const [rows, setRows] = useState<ApiInjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPatientInjections(patientId);
      setRows(data.injections ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load injections");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(row: ApiInjection, status: string) {
    try {
      await updateInjection(row.id, { status });
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status");
    }
  }

  const display = compact ? rows.slice(0, 5) : rows;

  return (
    <article className="panel p-3 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold text-ink">{compact ? "Recent Injections" : "Injection records"}</h3>
        <div className="flex items-center gap-2">
          {canAdd ? (
            <button
              type="button"
              onClick={() => setShowLog(true)}
              className="flex items-center gap-1 rounded bg-brand px-2 py-1 text-[10px] font-semibold text-white"
            >
              <Plus className="size-3" />
              Log injection
            </button>
          ) : (
            <span className="text-[10px] text-muted">Read-only monitoring</span>
          )}
          {compact && onViewAll ? (
            <button type="button" onClick={onViewAll} className="text-[11px] font-medium text-brand">
              View All
            </button>
          ) : null}
        </div>
      </div>
      {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="inner-table mt-2 w-full min-w-[640px] text-left text-sm">
          <thead className="text-[11px] uppercase text-faint">
            <tr>
              {["Date", "Factor / Medicine", "Dose", "Type", "Status", "Doctor / Center"].map((h) => (
                <th key={h} className="px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-2 py-4 text-[11px] text-muted">
                  Loading…
                </td>
              </tr>
            ) : display.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-4 text-[11px] text-muted">
                  {canAdd
                    ? "No injections logged yet. Click Log injection to connect this patient to a record."
                    : "No injections logged yet."}
                </td>
              </tr>
            ) : (
              display.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 py-2 text-[11px]">{row.date}</td>
                  <td className="px-2 py-2 text-[11px]">{row.factorMedicineName}</td>
                  <td className="px-2 py-2 text-[11px]">
                    {row.dose} {row.unit}
                  </td>
                  <td className="px-2 py-2 text-[11px]">{row.indication}</td>
                  <td className="px-2 py-2">
                    {canUpdate ? (
                      <StatusSelect value={row.status} onChange={(s) => void changeStatus(row, s)} />
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-[11px]">
                    {row.administeredBy}
                    <span className="block text-[10px] text-muted">{row.hospitalName}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showLog ? (
        <LogInjectionDialog
          patientId={patientId}
          hemophiliaType={hemophiliaType}
          onClose={() => setShowLog(false)}
          onSaved={() => {
            setShowLog(false);
            void load();
          }}
        />
      ) : null}
    </article>
  );
}

export function PatientTreatmentsPanel({ patientId }: { patientId: string }) {
  const { can } = useAuth();
  const canAdd = can(Perm.treatmentsAdd);
  const canUpdate = can(Perm.treatmentsUpdate);
  const [rows, setRows] = useState<ApiTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPatientTreatments(patientId);
      setRows(data.treatments ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(row: ApiTreatment, status: string) {
    await updateTreatment(row.id, { status });
    void load();
  }

  return (
    <article className="panel p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold text-ink">Treatment records</h3>
        {canAdd ? (
          <button
            type="button"
            onClick={() => setShowLog(true)}
            className="flex items-center gap-1 rounded bg-brand px-2 py-1 text-[10px] font-semibold text-white"
          >
            <Plus className="size-3" />
            Log treatment
          </button>
        ) : (
          <span className="text-[10px] text-muted">Read-only monitoring</span>
        )}
      </div>
      <table className="inner-table mt-2 w-full text-left text-sm">
        <thead className="text-[11px] uppercase text-faint">
          <tr>
            {["Date", "Type", "Description", "Status", "Center"].map((h) => (
              <th key={h} className="px-2 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="px-2 py-4 text-[11px] text-muted">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-2 py-4 text-[11px] text-muted">
                No treatment records yet.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-2 text-[11px]">{row.treatmentDate}</td>
                <td className="px-2 py-2 text-[11px]">{row.treatmentType}</td>
                <td className="px-2 py-2 text-[11px]">{row.description}</td>
                <td className="px-2 py-2">
                  {canUpdate ? (
                    <StatusSelect value={row.status} onChange={(s) => void changeStatus(row, s)} />
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-[11px]">{row.hospitalName}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {showLog ? (
        <LogTreatmentDialog
          patientId={patientId}
          onClose={() => setShowLog(false)}
          onSaved={() => {
            setShowLog(false);
            void load();
          }}
        />
      ) : null}
    </article>
  );
}
