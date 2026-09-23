"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, Search, Trash2, X } from "lucide-react";

import { TableBodySkeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/api";
import { showToast } from "@/lib/toastBus";

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

type Slot = {
  id: number;
  hospitalId: number;
  hospitalName: string;
  slotAt: string;
  capacity: number;
};

type Center = { id: number; name: string; province: string };

const STATUS_OPTIONS: Array<[string, string]> = [
  ["", "All statuses"],
  ["requested", "Requested"],
  ["confirmed", "Confirmed"],
  ["rescheduled", "Rescheduled"],
  ["declined", "Declined"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
];

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

function statusClass(status: string) {
  if (status === "confirmed" || status === "completed") return "bg-status-green-soft text-status-green";
  if (status === "declined" || status === "cancelled") return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
  return "bg-brand-soft text-brand";
}

export default function AppointmentsModule() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [canUpdate, setCanUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSlots, setShowSlots] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (debounced.trim()) query.set("search", debounced.trim());
    setLoading(true);
    try {
      const data = (await apiFetch(`/appointments/?${query}`)) as {
        appointments?: Appointment[];
        canUpdate?: boolean;
        canDelete?: boolean;
      };
      setRows(Array.isArray(data.appointments) ? data.appointments : []);
      setCanUpdate(Boolean(data.canUpdate));
      setCanDelete(Boolean(data.canDelete));
    } finally {
      setLoading(false);
    }
  }, [debounced, status]);

  useEffect(() => {
    void load().catch((err: Error) => showToast(err.message));
  }, [load]);

  function open(row: Appointment) {
    setSelected(row);
    setDoctorName(row.doctorName || "");
    setScheduledAt(toInput(row.scheduledAt || row.preferredAt));
    setAdminNote(row.adminNote || "");
  }

  function closeDetail() {
    setSelected(null);
  }

  async function save(nextStatus: string) {
    if (!selected) return;
    setSaving(true);
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
      showToast("Appointment updated");
      closeDetail();
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update the appointment");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected) return;
    setSaving(true);
    try {
      await apiFetch(`/appointments/${selected.id}/`, { method: "DELETE" });
      showToast("Appointment deleted");
      closeDetail();
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete the appointment");
    } finally {
      setSaving(false);
    }
  }

  const waiting = useMemo(() => rows.filter((row) => row.status === "requested").length, [rows]);

  return (
    <div className="admin-page admin-page--fill">
      <div className="admin-page-sticky admin-page-sticky--fixed space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Appointments</h1>
          <p className="text-[11px] text-muted">Home &gt; Appointments &gt; Requests from patients</p>
        </div>
        {canUpdate ? (
          <button
            type="button"
            className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
            onClick={() => setShowSlots((value) => !value)}
          >
            <CalendarPlus className="size-3.5" />
            {showSlots ? "Hide available times" : "Set available times"}
          </button>
        ) : null}
      </div>

        <div className="filter-bar">
          <label className="panel-inset flex h-8 min-w-[200px] flex-1 items-center gap-2 px-2.5 shadow-none">
            <Search className="size-3.5 text-faint" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
              placeholder="Search by name or Unique Patient ID (HEM-…)"
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="panel h-8 px-2.5 text-[11px] text-muted shadow-none outline-none"
          >
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value || "all"} value={value}>
                {label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted">
            Total: <span className="text-[13px] font-semibold text-ink">{rows.length}</span>
            {waiting > 0 ? (
              <>
                {" "}· Awaiting reply: <span className="text-[13px] font-semibold text-ink">{waiting}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="admin-page-body">
      {showSlots ? <SlotManager /> : null}

      {selected ? (
        <section className="panel p-4">
          <div className="flex items-start justify-between gap-3 border-b border-line-subtle pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-ink">{selected.patientName}</h2>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(selected.status)}`}>
                  {selected.statusLabel}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted">
                {selected.patientId} · {selected.visitTypeLabel} · {selected.hospitalName}, {selected.province}
              </p>
            </div>
            <button type="button" className="rounded p-1 text-muted hover:bg-elevated" aria-label="Close" onClick={() => setSelected(null)}>
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Request</p>
              <p className="panel-inset px-3 py-2 text-[12px] text-ink">{selected.reason || "No reason given."}</p>
              <p className="text-[11px] text-muted">
                Preferred time: <span className="font-medium text-ink">{when(selected.preferredAt)}</span>
              </p>
              {selected.patientNote ? <p className="text-[11px] text-muted">Patient note: {selected.patientNote}</p> : null}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Response</p>
              <label className="block text-[11px] font-medium text-ink">
                Doctor / clinician
                <input
                  value={doctorName}
                  onChange={(event) => setDoctorName(event.target.value)}
                  className="panel-inset mt-1 h-8 w-full px-2.5 text-[12px] text-ink outline-none"
                />
              </label>
              <label className="block text-[11px] font-medium text-ink">
                Confirmed date and time
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="panel-inset mt-1 h-8 w-full px-2.5 text-[12px] text-ink outline-none"
                />
              </label>
              <label className="block text-[11px] font-medium text-ink">
                Message to the patient
                <textarea
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  className="panel-inset mt-1 min-h-16 w-full px-2.5 py-2 text-[12px] text-ink outline-none"
                />
              </label>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
            {canUpdate ? (
              <>
                <button type="button" disabled={saving} onClick={() => void save("confirmed")} className="rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60">
                  Confirm
                </button>
                <button type="button" disabled={saving} onClick={() => void save("rescheduled")} className="panel px-3 py-1.5 text-[11px] font-semibold text-ink shadow-none hover:bg-elevated disabled:opacity-60">
                  Reschedule
                </button>
                <button type="button" disabled={saving} onClick={() => void save("completed")} className="panel px-3 py-1.5 text-[11px] font-semibold text-ink shadow-none hover:bg-elevated disabled:opacity-60">
                  Mark visited
                </button>
                <button type="button" disabled={saving} onClick={() => void save("declined")} className="panel px-3 py-1.5 text-[11px] font-semibold text-red-600 shadow-none hover:bg-red-50 disabled:opacity-60">
                  Decline
                </button>
              </>
            ) : (
              <p className="text-[11px] text-muted">View only — update permission is required to take action.</p>
            )}
            {canDelete ? (
              <button type="button" disabled={saving} onClick={() => void remove()} className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-60">
                <Trash2 className="size-3.5" />
                Delete
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="panel admin-list-panel overflow-hidden">
        <div className="admin-table-scroll overflow-x-auto">
          <table className="data-table w-full min-w-[860px] text-left text-sm">
            <thead className="bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {["Patient", "Visit type", "Centre", "Preferred", "Scheduled", "Doctor", "Status"].map((h) => (
                  <th key={h} className="px-3 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableBodySkeleton rows={10} columns={7} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[11px] text-muted">
                    No appointments match this filter.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`cursor-pointer hover:bg-elevated/70 dark:hover:bg-white/[0.03] ${selected?.id === row.id ? "bg-brand-soft/50" : ""}`}
                    onClick={() => open(row)}
                  >
                    <td className="px-3 py-3">
                      <p className="font-semibold text-ink">{row.patientName}</p>
                      <p className="text-[11px] text-brand">{row.patientId}</p>
                    </td>
                    <td className="px-3 py-3 text-ink">{row.visitTypeLabel}</td>
                    <td className="px-3 py-3 text-muted">{row.hospitalName}</td>
                    <td className="px-3 py-3 text-muted">{when(row.preferredAt)}</td>
                    <td className="px-3 py-3 text-muted">{when(row.scheduledAt)}</td>
                    <td className="px-3 py-3 text-muted">{row.doctorName || "—"}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                        {row.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
          onClick={() => closeDetail()}
        >
          <section
            className="panel w-full max-w-3xl p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line-subtle pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="appointment-detail-title" className="text-[15px] font-semibold text-ink">
                    {selected.patientName}
                  </h2>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(selected.status)}`}>
                    {selected.statusLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted">
                  {selected.patientId} · {selected.visitTypeLabel} · {selected.hospitalName}, {selected.province}
                </p>
              </div>
              <button
                type="button"
                className="rounded p-1 text-muted hover:bg-elevated"
                aria-label="Close"
                onClick={() => closeDetail()}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Request</p>
                <p className="panel-inset px-3 py-2 text-[12px] text-ink">{selected.reason || "No reason given."}</p>
                <p className="text-[11px] text-muted">
                  Preferred time: <span className="font-medium text-ink">{when(selected.preferredAt)}</span>
                </p>
                {selected.patientNote ? <p className="text-[11px] text-muted">Patient note: {selected.patientNote}</p> : null}
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Response</p>
                <label className="block text-[11px] font-medium text-ink">
                  Doctor / clinician
                  <input
                    value={doctorName}
                    onChange={(event) => setDoctorName(event.target.value)}
                    className="panel-inset mt-1 h-8 w-full px-2.5 text-[12px] text-ink outline-none"
                  />
                </label>
                <label className="block text-[11px] font-medium text-ink">
                  Confirmed date and time
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                    className="panel-inset mt-1 h-8 w-full px-2.5 text-[12px] text-ink outline-none"
                  />
                </label>
                <label className="block text-[11px] font-medium text-ink">
                  Message to the patient
                  <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    className="panel-inset mt-1 min-h-16 w-full px-2.5 py-2 text-[12px] text-ink outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
              {canUpdate ? (
                <>
                  <button type="button" disabled={saving} onClick={() => void save("confirmed")} className="rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60">
                    Confirm
                  </button>
                  <button type="button" disabled={saving} onClick={() => void save("rescheduled")} className="panel px-3 py-1.5 text-[11px] font-semibold text-ink shadow-none hover:bg-elevated disabled:opacity-60">
                    Reschedule
                  </button>
                  <button type="button" disabled={saving} onClick={() => void save("completed")} className="panel px-3 py-1.5 text-[11px] font-semibold text-ink shadow-none hover:bg-elevated disabled:opacity-60">
                    Mark visited
                  </button>
                  <button type="button" disabled={saving} onClick={() => void save("declined")} className="panel px-3 py-1.5 text-[11px] font-semibold text-red-600 shadow-none hover:bg-red-50 disabled:opacity-60">
                    Decline
                  </button>
                </>
              ) : (
                <p className="text-[11px] text-muted">View only — update permission is required to take action.</p>
              )}
              {canDelete ? (
                <button type="button" disabled={saving} onClick={() => void remove()} className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline disabled:opacity-60">
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

type SlotSchedule = {
  id: number;
  hospitalName: string;
  times: string[];
  repeatMode: string;
  repeatModeLabel: string;
  excludeWeekdays: number[];
  weeksAhead: number;
};

const WEEKDAY_OPTIONS = [
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

function SlotManager() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [schedules, setSchedules] = useState<SlotSchedule[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [hospitalId, setHospitalId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [times, setTimes] = useState("10:00, 11:00, 14:00");
  const [repeatMode, setRepeatMode] = useState<"every_day" | "weekdays" | "except_days">("every_day");
  const [excludeDays, setExcludeDays] = useState<number[]>([5, 6]);
  const [weeksAhead, setWeeksAhead] = useState(8);
  const [saving, setSaving] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const load = useCallback(async () => {
    try {
      const [slotData, scheduleData, centerData] = await Promise.all([
        apiFetch("/appointments/slots/") as Promise<{ slots?: Slot[] }>,
        apiFetch("/appointments/slots/schedules/") as Promise<{ schedules?: SlotSchedule[] }>,
        apiFetch("/hospitals/") as Promise<{ hospitals?: Center[] }>,
      ]);
      setSlots(Array.isArray(slotData.slots) ? slotData.slots : []);
      setSchedules(Array.isArray(scheduleData.schedules) ? scheduleData.schedules : []);
      const rows = Array.isArray(centerData.hospitals) ? centerData.hospitals : [];
      setCenters(rows);
      setHospitalId((current) => current ?? rows[0]?.id ?? null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not load available times");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    if (!hospitalId || !date) {
      showToast("Pick a centre and a date first.");
      return;
    }
    const parsed = times
      .split(/[,;\s]+/)
      .map((item) => item.trim())
      .filter((item) => /^\d{1,2}:\d{2}$/.test(item))
      .map((item) => `${date}T${item.padStart(5, "0")}`);
    if (parsed.length === 0) {
      showToast("Enter at least one time, for example 10:00.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/appointments/slots/", {
        method: "POST",
        body: JSON.stringify({ hospitalId, times: parsed }),
      });
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save the times");
    } finally {
      setSaving(false);
    }
  }

  async function removeSlot(id: number) {
    try {
      await apiFetch(`/appointments/slots/${id}/`, { method: "DELETE" });
      setSlots((rows) => rows.filter((row) => row.id !== id));
      showToast("Time removed");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove the time");
    }
  }

  async function removeDay(groupSlots: Slot[]) {
    if (!window.confirm(`Remove all ${groupSlots.length} published times for this day?`)) return;
    try {
      await Promise.all(groupSlots.map((slot) => apiFetch(`/appointments/slots/${slot.id}/`, { method: "DELETE" })));
      setSlots((rows) => rows.filter((row) => !groupSlots.some((slot) => slot.id === row.id)));
      showToast("Day removed");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove this day");
      await load();
    }
  }

  async function addRecurring() {
    if (!hospitalId) {
      showToast("Pick a centre first.");
      return;
    }
    const parsed = times
      .split(/[,;\s]+/)
      .map((item) => item.trim())
      .filter((item) => /^\d{1,2}:\d{2}$/.test(item));
    if (parsed.length === 0) {
      showToast("Enter at least one time, for example 10:00.");
      return;
    }
    setSavingSchedule(true);
    try {
      await apiFetch("/appointments/slots/schedules/", {
        method: "POST",
        body: JSON.stringify({
          hospitalId,
          times: parsed,
          repeatMode,
          excludeDays: repeatMode === "weekdays" ? [] : excludeDays,
          weeksAhead,
        }),
      });
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save the recurring schedule");
    } finally {
      setSavingSchedule(false);
    }
  }

  async function removeSchedule(id: number) {
    if (!window.confirm("Remove this recurring schedule and all matching future times?")) return;
    try {
      await apiFetch(`/appointments/slots/schedules/${id}/`, { method: "DELETE" });
      await load();
      showToast("Recurring schedule removed");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not remove the schedule");
    }
  }

  function toggleExcludeDay(day: number) {
    setExcludeDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort(),
    );
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const key = `${slot.hospitalName} — ${new Date(slot.slotAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}`;
      map.set(key, [...(map.get(key) || []), slot]);
    }
    return Array.from(map.entries());
  }, [slots]);

  return (
    <section className="panel flex min-h-0 flex-col overflow-hidden p-4">
      <div className="shrink-0">
      <h2 className="text-[13px] font-semibold text-ink">Available dates and times</h2>
      <p className="mt-0.5 text-[11px] text-muted">
        Patients can only pick from the times you publish here when they book from the app.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="block text-[11px] font-medium text-ink">
          Centre
          <select
            value={hospitalId ?? ""}
            onChange={(event) => setHospitalId(Number(event.target.value) || null)}
            className="panel-inset mt-1 block h-8 min-w-[180px] px-2.5 text-[12px] text-ink outline-none"
          >
            {centers.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-medium text-ink">
          Date
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDate(event.target.value)}
            className="panel-inset mt-1 block h-8 px-2.5 text-[12px] text-ink outline-none"
          />
        </label>
        <label className="block flex-1 text-[11px] font-medium text-ink">
          Times (comma separated, 24-hour)
          <input
            value={times}
            onChange={(event) => setTimes(event.target.value)}
            placeholder="10:00, 11:00, 14:00"
            className="panel-inset mt-1 block h-8 w-full px-2.5 text-[12px] text-ink outline-none"
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void add()}
          className="h-8 rounded bg-brand px-3 text-[11px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
        >
          {saving ? "Saving…" : "Publish one day"}
        </button>
      </div>

      <div className="mt-4 rounded border border-line-subtle p-3">
        <h3 className="text-[12px] font-semibold text-ink">Recurring weekly schedule</h3>
        <p className="mt-0.5 text-[11px] text-muted">
          Publish the same times every day, on weekdays only, or every day except selected days (e.g. skip Saturday and
          Sunday).
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="block text-[11px] font-medium text-ink">
            Repeat
            <select
              value={repeatMode}
              onChange={(event) => setRepeatMode(event.target.value as typeof repeatMode)}
              className="panel-inset mt-1 block h-8 min-w-[200px] px-2.5 text-[12px] text-ink outline-none"
            >
              <option value="every_day">Every day</option>
              <option value="weekdays">Weekdays (Mon–Fri)</option>
              <option value="except_days">Every day except selected days</option>
            </select>
          </label>
          <label className="block text-[11px] font-medium text-ink">
            Weeks ahead
            <input
              type="number"
              min={1}
              max={26}
              value={weeksAhead}
              onChange={(event) => setWeeksAhead(Number(event.target.value) || 8)}
              className="panel-inset mt-1 block h-8 w-20 px-2.5 text-[12px] text-ink outline-none"
            />
          </label>
          <button
            type="button"
            disabled={savingSchedule}
            onClick={() => void addRecurring()}
            className="h-8 rounded bg-brand px-3 text-[11px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
          >
            {savingSchedule ? "Publishing…" : "Publish recurring times"}
          </button>
        </div>
        {repeatMode !== "weekdays" ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAY_OPTIONS.map((day) => (
              <label key={day.value} className="flex items-center gap-1 text-[11px] text-ink">
                <input
                  type="checkbox"
                  checked={excludeDays.includes(day.value)}
                  onChange={() => toggleExcludeDay(day.value)}
                />
                Skip {day.label}
              </label>
            ))}
          </div>
        ) : null}
        {schedules.length > 0 ? (
          <ul className="mt-3 space-y-1 text-[11px] text-muted">
            {schedules.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2">
                <span>
                  {row.hospitalName} · {row.repeatModeLabel} · {row.times.join(", ")} · {row.weeksAhead} wk
                </span>
                <button
                  type="button"
                  className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => void removeSchedule(row.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      </div>

      <div className="admin-scroll admin-panel-scroll--15 relative z-0 mt-3 pr-1">
        {grouped.length === 0 ? (
          <p className="text-[11px] text-muted">No upcoming times published yet.</p>
        ) : (
          <div className="space-y-2 pb-1">
            {grouped.map(([label, groupSlots]) => (
              <div key={label} className="panel-inset px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-ink">{label}</p>
                  <button
                    type="button"
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => void removeDay(groupSlots)}
                  >
                    Remove day
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {groupSlots.map((slot) => (
                    <span key={slot.id} className="panel inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-ink shadow-none">
                      {new Date(slot.slotAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      <button
                        type="button"
                        aria-label="Remove time"
                        className="relative z-10 rounded p-1 text-muted hover:bg-red-50 hover:text-red-600"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void removeSlot(slot.id);
                        }}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
