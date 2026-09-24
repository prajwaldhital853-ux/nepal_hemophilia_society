"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { NotesButton, NotesDrawer } from "@/features/notes/components/NotesDrawer";
import { invalidateNoteCounts, useNoteCounts } from "@/features/notes/useNoteCounts";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type BleedingEpisode = {
  id: number;
  episodeDate: string;
  site: string;
  severity: string;
  hospitalName: string;
  notes?: string;
  recordedBy?: string;
  createdAt?: string;
};

function formatDate(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function severityClass(severity: string) {
  const value = severity.toLowerCase();
  if (value.includes("severe") || value.includes("major")) return "bg-red-50 font-semibold text-red-700";
  if (value.includes("moderate")) return "bg-amber-50 font-semibold text-amber-700";
  if (value.includes("mild")) return "bg-emerald-50 font-semibold text-emerald-700";
  return "text-ink";
}

export function PatientBleedingPanel({
  patientId,
  primaryHospital = "",
  loggingCenter,
  canLogClinical = false,
  compact = false,
  onViewAll,
}: {
  patientId: string;
  primaryHospital?: string;
  loggingCenter?: string;
  canLogClinical?: boolean;
  compact?: boolean;
  onViewAll?: () => void;
}) {
  const { user } = useAuth();
  const canAdd = canLogClinical;
  const resolvedLoggingCenter =
    loggingCenter ??
    (user?.hospitalStaff?.treatmentCenter || user?.provinceAdmin?.defaultLoggingCenter || primaryHospital);
  const [rows, setRows] = useState<BleedingEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [episodeDate, setEpisodeDate] = useState("");
  const [site, setSite] = useState("");
  const [severity, setSeverity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notesFor, setNotesFor] = useState<BleedingEpisode | null>(null);
  const { countFor } = useNoteCounts(patientId);

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
          treatmentCenter: resolvedLoggingCenter || undefined,
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

  const display = compact ? rows.slice(0, 12) : rows;
  const severeCount = rows.filter((row) => row.severity.toLowerCase().includes("severe")).length;

  return (
    <article className="panel w-full p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[12px] font-semibold text-ink">Bleeding history</h3>
          <p className="mt-0.5 text-[10px] text-muted">
            {rows.length} episode{rows.length === 1 ? "" : "s"}
            {severeCount ? ` · ${severeCount} severe` : ""}
            {primaryHospital ? ` · ${primaryHospital}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {compact && onViewAll && rows.length > 0 ? (
            <button type="button" onClick={onViewAll} className="text-[10px] font-semibold text-brand">
              View All
            </button>
          ) : null}
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
      </div>
      {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}
      <div className={`mt-2 overflow-x-auto ${compact ? "max-h-[280px] overflow-y-auto" : ""}`}>
        <table className="inner-table w-full text-left text-sm">
          <thead className="sticky top-0 bg-elevated text-[10px] uppercase text-faint">
            <tr>
              {["Date", "Bleed site", "Severity", "Treatment center", "Notes", "Recorded by", "Recorded at"].map((h) => (
                <th key={h} className="px-2 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-[11px] text-muted">Loading…</td>
              </tr>
            ) : display.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-[11px] text-muted">No bleeding episodes recorded.</td>
              </tr>
            ) : (
              display.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 py-2 text-[11px] font-medium whitespace-nowrap">{formatDate(row.episodeDate)}</td>
                  <td className="px-2 py-2 text-[11px] capitalize">{row.site || "—"}</td>
                  <td className="px-2 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] capitalize ${severityClass(row.severity)}`}>
                      {row.severity || "—"}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-[11px]">{row.hospitalName || "—"}</td>
                  <td className="max-w-[280px] px-2 py-2 text-[11px] text-muted">
                    <div className="flex items-start gap-1.5">
                      <span className="line-clamp-2 flex-1">{row.notes || "—"}</span>
                      <NotesButton count={countFor("bleeding", row.id)} onClick={() => setNotesFor(row)} />
                    </div>
                  </td>
                  <td className="px-2 py-2 text-[11px]">{row.recordedBy || "—"}</td>
                  <td className="px-2 py-2 text-[11px] text-muted whitespace-nowrap">{formatDateTime(row.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {notesFor ? (
        <NotesDrawer
          targetType="bleeding"
          targetId={notesFor.id}
          title={`Bleed · ${formatDate(notesFor.episodeDate)}`}
          subtitle={[notesFor.site, notesFor.severity, notesFor.hospitalName].filter(Boolean).join(" · ")}
          legacyNote={notesFor.notes ? { label: "Note recorded with episode", body: notesFor.notes } : null}
          onClose={() => setNotesFor(null)}
          onChanged={() => invalidateNoteCounts(patientId)}
        />
      ) : null}

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
              Bleed site
              <input value={site} onChange={(e) => setSite(e.target.value)} className={fieldClass} placeholder="e.g. right knee" />
            </label>
            <label className="block text-[11px]">
              Severity
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={fieldClass}>
                <option value="">Select severity</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </label>
            <label className="block text-[11px]">
              Notes
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} rows={3} placeholder="Cause, treatment given, follow-up…" />
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
