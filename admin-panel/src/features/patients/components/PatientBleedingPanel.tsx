"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Perm } from "@/lib/permissions";

type BleedingEpisode = {
  id: number;
  episodeDate: string;
  site: string;
  severity: string;
  hospitalName: string;
  notes?: string;
  recordedBy?: string;
};

export function PatientBleedingPanel({
  patientId,
  primaryHospital = "",
  compact = false,
}: {
  patientId: string;
  primaryHospital?: string;
  compact?: boolean;
}) {
  const { can } = useAuth();
  const canAdd = can(Perm.injectionsAdd);
  const [rows, setRows] = useState<BleedingEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [episodeDate, setEpisodeDate] = useState("");
  const [site, setSite] = useState("");
  const [severity, setSeverity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/patients/${encodeURIComponent(patientId)}/bleeding-episodes/`);
      setRows(data.episodes ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    setError("");
    try {
      await apiFetch(`/patients/${encodeURIComponent(patientId)}/bleeding-episodes/`, {
        method: "POST",
        body: JSON.stringify({
          episodeDate,
          site,
          severity,
          notes,
          treatmentCenter: primaryHospital || undefined,
        }),
      });
      setShowForm(false);
      setEpisodeDate("");
      setSite("");
      setSeverity("");
      setNotes("");
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save bleeding episode");
    }
  }

  const display = compact ? rows.slice(0, 5) : rows;

  return (
    <article className="panel p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold text-ink">Bleeding episodes</h3>
        {canAdd ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded bg-brand px-2 py-1 text-[10px] font-semibold text-white"
          >
            <Plus className="size-3" />
            Add episode
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}
      <table className="inner-table mt-2 w-full text-left text-sm">
        <thead className="text-[11px] uppercase text-faint">
          <tr>
            {["Date", "Site", "Severity", "Center", "Recorded by"].map((h) => (
              <th key={h} className="px-2 py-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="px-2 py-4 text-[11px] text-muted">Loading…</td></tr>
          ) : display.length === 0 ? (
            <tr><td colSpan={5} className="px-2 py-4 text-[11px] text-muted">No bleeding episodes recorded.</td></tr>
          ) : (
            display.map((row) => (
              <tr key={row.id}>
                <td className="px-2 py-2 text-[11px]">{row.episodeDate}</td>
                <td className="px-2 py-2 text-[11px]">{row.site || "—"}</td>
                <td className="px-2 py-2 text-[11px]">{row.severity || "—"}</td>
                <td className="px-2 py-2 text-[11px]">{row.hospitalName}</td>
                <td className="px-2 py-2 text-[11px]">{row.recordedBy || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            className="w-full max-w-md space-y-3 rounded border border-line bg-card p-5"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <h2 className="text-[14px] font-semibold text-ink">Add bleeding episode</h2>
            <label className="block text-[11px]">
              Date *
              <input type="date" value={episodeDate} onChange={(e) => setEpisodeDate(e.target.value)} className={fieldClass} required />
            </label>
            <label className="block text-[11px]">
              Site
              <input value={site} onChange={(e) => setSite(e.target.value)} className={fieldClass} placeholder="e.g. left knee" />
            </label>
            <label className="block text-[11px]">
              Severity
              <input value={severity} onChange={(e) => setSeverity(e.target.value)} className={fieldClass} placeholder="e.g. Moderate" />
            </label>
            <label className="block text-[11px]">
              Notes
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} rows={2} />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded border border-line py-2 text-[11px] font-semibold">
                Cancel
              </button>
              <button type="submit" className="flex-1 rounded bg-brand py-2 text-[11px] font-semibold text-white">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </article>
  );
}

const fieldClass =
  "mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand";
