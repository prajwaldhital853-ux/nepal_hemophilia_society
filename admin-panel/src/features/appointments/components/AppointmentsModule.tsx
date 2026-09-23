"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

type Appointment = {
  id: number;
  patientId: string;
  patientName: string;
  hospitalName: string;
  province: string;
  visitTypeLabel: string;
  reason: string;
  preferredAt: string;
  scheduledAt?: string | null;
  doctorName?: string;
  status: string;
  statusLabel: string;
  adminNote?: string;
  patientNote?: string;
};

const STATUSES = ["", "requested", "confirmed", "rescheduled", "declined", "completed", "cancelled"];

function when(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toInput(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AppointmentsModule() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [status, setStatus] = useState("requested");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (search.trim()) query.set("search", search.trim());
    const data = (await apiFetch(`/appointments/?${query}`)) as {
      appointments?: Appointment[];
      canUpdate?: boolean;
      canDelete?: boolean;
    };
    setRows(Array.isArray(data.appointments) ? data.appointments : []);
    setCanUpdate(Boolean(data.canUpdate));
    setCanDelete(Boolean(data.canDelete));
  }, [search, status]);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  function open(row: Appointment) {
    setSelected(row);
    setDoctorName(row.doctorName || "");
    setScheduledAt(toInput(row.scheduledAt || row.preferredAt));
    setAdminNote(row.adminNote || "");
    setError("");
  }

  async function save(nextStatus: string) {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/appointments/${selected.id}/`, {
        method: "PUT",
        body: JSON.stringify({
          status: nextStatus,
          doctorName,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          adminNote,
        }),
      });
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the appointment");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected) return;
    setSaving(true);
    try {
      await apiFetch(`/appointments/${selected.id}/`, { method: "DELETE" });
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the appointment");
    } finally {
      setSaving(false);
    }
  }

  const waiting = rows.filter((row) => row.status === "requested").length;

  return (
    <div className="space-y-3">
      <section className="panel overflow-hidden">
        <div className="bg-[#001D3D] px-4 py-4 text-white">
          <p className="text-[11px] font-bold uppercase tracking-wide text-red-200">Centre scheduling</p>
          <h1 className="mt-1 text-xl font-bold">Appointments</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-slate-200">
            Requests from patients at your centre or province. Confirm a doctor and time, reschedule, or decline. Patients are notified of every decision.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-3 py-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or HEM ID"
            className="h-9 min-w-48 flex-1 rounded-lg border border-black/10 px-3 text-[13px]"
          />
          <span className="rounded-full bg-orange-50 px-3 py-1 text-[12px] font-semibold text-orange-700">{waiting} waiting in this view</span>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 pb-3">
          {STATUSES.map((item) => (
            <button
              key={item || "all"}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold ${status === item ? "bg-[#001D3D] text-white" : "bg-slate-100 text-slate-700"}`}
            >
              {item || "All"}
            </button>
          ))}
        </div>
      </section>

      {error ? <p className="text-[13px] text-red-700">{error}</p> : null}

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-2">
          {rows.length === 0 ? <p className="panel px-4 py-8 text-center text-[13px] text-muted">No appointments in this view.</p> : null}
          {rows.map((row) => (
            <button key={row.id} type="button" onClick={() => open(row)} className="panel block w-full px-4 py-3 text-left hover:bg-elevated">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-bold text-ink">{row.patientName}</p>
                  <p className="text-[12px] text-muted">{row.patientId} · {row.visitTypeLabel}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase text-slate-700">{row.statusLabel}</span>
              </div>
              <p className="mt-2 text-[12px] text-ink">{row.hospitalName} · {row.province}</p>
              <p className="text-[12px] text-muted">Requested {when(row.preferredAt)}{row.scheduledAt ? ` · Scheduled ${when(row.scheduledAt)}` : ""}</p>
              <p className="mt-1 text-[12px] text-ink">{row.reason}</p>
            </button>
          ))}
        </div>

        <aside className="panel h-fit p-4">
          {!selected ? <p className="text-[13px] text-muted">Select a request to assign a doctor, confirm the time, or decline it.</p> : null}
          {selected ? (
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase text-red-700">{selected.statusLabel}</p>
                <h2 className="text-lg font-bold text-ink">{selected.patientName}</h2>
                <p className="text-[12px] text-muted">{selected.patientId} · {selected.hospitalName}</p>
              </div>
              <p className="rounded-lg bg-slate-50 p-3 text-[13px] text-ink">{selected.reason}</p>
              <label className="block text-[12px] font-semibold text-ink">
                Doctor / clinician
                <input value={doctorName} onChange={(event) => setDoctorName(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-black/10 px-3" />
              </label>
              <label className="block text-[12px] font-semibold text-ink">
                Confirmed time
                <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-black/10 px-3" />
              </label>
              <label className="block text-[12px] font-semibold text-ink">
                Message to the patient
                <textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-black/10 px-3 py-2" />
              </label>
              {canUpdate ? (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" disabled={saving} onClick={() => void save("confirmed")} className="rounded-lg bg-[#C1121F] px-3 py-2 text-[12px] font-bold text-white">Confirm</button>
                  <button type="button" disabled={saving} onClick={() => void save("rescheduled")} className="rounded-lg bg-[#001D3D] px-3 py-2 text-[12px] font-bold text-white">Reschedule</button>
                  <button type="button" disabled={saving} onClick={() => void save("declined")} className="rounded-lg border px-3 py-2 text-[12px] font-bold">Decline</button>
                  <button type="button" disabled={saving} onClick={() => void save("completed")} className="rounded-lg border px-3 py-2 text-[12px] font-bold">Mark visited</button>
                </div>
              ) : (
                <p className="text-[12px] text-muted">You can view this request. Update permission is required to take action.</p>
              )}
              {canDelete ? (
                <button type="button" disabled={saving} onClick={() => void remove()} className="text-[12px] font-semibold text-red-700">
                  Delete appointment
                </button>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
