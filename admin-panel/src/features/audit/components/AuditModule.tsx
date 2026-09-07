"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Download, Search, ShieldAlert } from "lucide-react";

import { auditModules, type AuditLog, type AuditSeverity } from "@/features/audit/data/mockAudit";
import { apiFetch } from "@/lib/api";

function severityClass(severity: AuditSeverity) {
  if (severity === "Critical") return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
  if (severity === "Warning") return "bg-status-amber-soft text-status-amber";
  return "bg-brand-soft text-brand";
}

export default function AuditModule() {
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [openModule, setOpenModule] = useState(false);
  const [openId, setOpenId] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void apiFetch("/audit/")
      .then((data) => {
        const next = (data.logs ?? []).map((row: Record<string, string>) => ({
          id: String(row.id),
          actor: row.actor || "—",
          action: row.action || "—",
          module: row.module || "—",
          ip: row.ip || "—",
          time: row.createdAt ? new Date(row.createdAt).toLocaleString() : "",
          severity: "Info" as AuditSeverity,
          detail: row.detail || row.objectId || "",
        }));
        setLogs(next);
        if (next[0]) setOpenId(String(next[0].id));
      })
      .catch((err: Error) => setError(err.message || "Audit logs are Super Admin only."));
  }, []);

  const rows = useMemo(() => {
    return logs.filter((row) => {
      const matchModule = moduleFilter === "All" || row.module === moduleFilter;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        row.actor.toLowerCase().includes(q) ||
        row.action.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q);
      return matchModule && matchQuery;
    });
  }, [query, moduleFilter, logs]);

  const uniqueActors = new Set(logs.map((row) => row.actor)).size;

  const selected = rows.find((row) => row.id === openId) ?? rows[0];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Audit Logs</h1>
          <p className="text-[11px] text-muted">Home &gt; Audit Logs · live trail of privileged actions</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
          {logs.length} events
        </span>
      </div>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <article className="panel p-2.5">
          <p className="text-[10px] text-muted">Total in trail</p>
          <p className="text-[15px] font-semibold text-ink">{logs.length}</p>
        </article>
        <article className="panel p-2.5">
          <p className="text-[10px] text-muted">Showing</p>
          <p className="text-[15px] font-semibold text-status-amber">{rows.length}</p>
        </article>
        <article className="panel p-2.5">
          <p className="text-[10px] text-muted">Modules</p>
          <p className="text-[15px] font-semibold text-red-500">{new Set(logs.map((r) => r.module)).size}</p>
        </article>
        <article className="panel p-2.5">
          <p className="text-[10px] text-muted">Unique actors</p>
          <p className="text-[15px] font-semibold text-ink">{uniqueActors}</p>
        </article>
      </div>

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="panel overflow-hidden">
          <div className="filter-bar">
            <label className="panel-inset flex h-8 min-w-[180px] flex-1 items-center gap-2 px-2.5 shadow-none">
              <Search className="size-3.5 text-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
                placeholder="Search actor, action or ID..."
              />
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenModule((v) => !v)}
                className="panel flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
              >
                {moduleFilter === "All" ? "All modules" : moduleFilter}
                <ChevronDown className="size-3.5" />
              </button>
              {openModule ? (
                <div className="absolute z-20 mt-1 w-40 overflow-hidden panel shadow-lg">
                  {auditModules.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-brand-soft ${
                        moduleFilter === item ? "bg-brand text-white hover:bg-brand" : ""
                      }`}
                      onClick={() => {
                        setModuleFilter(item);
                        setOpenModule(false);
                      }}
                    >
                      {item === "All" ? "All modules" : item}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button type="button" className="panel ml-auto flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none">
              <Download className="size-3.5" />
              Export trail
            </button>
          </div>
          <ul className="divide-y divide-line-subtle">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(row.id)}
                  className={`flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-elevated/70 ${
                    selected?.id === row.id ? "bg-brand-soft/50" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                      row.severity === "Critical" ? "bg-red-500/15 text-red-500" : "bg-brand-soft text-brand"
                    }`}
                  >
                    {row.severity === "Critical" ? <AlertTriangle className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold text-ink">{row.action}</span>
                    <span className="block text-[10px] text-muted">
                      {row.actor} · {row.module} · {row.time}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${severityClass(row.severity)}`}>
                    {row.severity}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {selected ? (
          <aside className="panel p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-faint">Event detail</p>
            <h2 className="mt-1 text-[13px] font-semibold text-ink">{selected.id}</h2>
            <dl className="mt-3 space-y-2 text-[11px]">
              {[
                ["Actor", selected.actor],
                ["Module", selected.module],
                ["IP", selected.ip],
                ["When", selected.time],
                ["Severity", selected.severity],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 rounded bg-elevated px-2.5 py-2 text-[11px] leading-5 text-muted">{selected.detail}</p>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
