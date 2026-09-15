"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { PermissionGroup, PermissionItem } from "@/features/admins/api";

const COLUMNS = [
  { id: "view", label: "View" },
  { id: "add", label: "Add" },
  { id: "update", label: "Update" },
  { id: "delete", label: "Delete" },
] as const;

type ColumnId = (typeof COLUMNS)[number]["id"];

function columnOf(perm: PermissionItem): ColumnId | "extra" {
  if (
    perm.code.endsWith(".search") ||
    perm.code.includes("verify") ||
    perm.code.includes("correct") ||
    perm.code === "provinceAdmins.manage" ||
    perm.code === "reports.province" ||
    perm.code === "reports.national"
  ) {
    return "extra";
  }
  if (perm.action === "delete" || perm.code.endsWith(".delete")) return "delete";
  if (perm.action === "create" || perm.action === "add") return "add";
  if (perm.action === "view") return "view";
  if (perm.action === "update" || perm.action === "manage") return "update";
  return "extra";
}

function slotsFor(group: PermissionGroup) {
  const slots: Partial<Record<ColumnId, PermissionItem>> = {};
  const extras: PermissionItem[] = [];
  const manage = group.permissions.find((perm) => perm.action === "manage" || perm.code.endsWith(".manage") || perm.code.endsWith(".system"));

  for (const perm of group.permissions) {
    const column = columnOf(perm);
    if (column === "extra") {
      extras.push(perm);
      continue;
    }
    if (!slots[column]) slots[column] = perm;
    else if (slots[column]?.code !== perm.code) extras.push(perm);
  }

  if (manage) {
    if (!slots.add) slots.add = { ...manage, action: "create", label: "Add" };
    if (!slots.update) slots.update = { ...manage, action: "update", label: "Update" };
  }

  return { slots, extras };
}

export default function PermissionMatrix({
  groups,
  selected,
  onChange,
  viewOnly,
  roleDefaults,
  roleLabel,
}: {
  groups: PermissionGroup[];
  selected: string[];
  onChange: (codes: string[]) => void;
  viewOnly?: boolean;
  roleDefaults?: string[];
  roleLabel?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups.filter(
      (group) =>
        group.label.toLowerCase().includes(needle) ||
        group.permissions.some(
          (perm) => perm.label.toLowerCase().includes(needle) || perm.code.toLowerCase().includes(needle),
        ),
    );
  }, [groups, query]);

  const total = new Set(groups.flatMap((group) => group.permissions.map((perm) => perm.code))).size;

  function toggle(code: string, action: string) {
    if (viewOnly && action !== "view") return;
    onChange(selected.includes(code) ? selected.filter((item) => item !== code) : [...selected, code]);
  }

  function setPreset(mode: "view" | "full" | "none" | "role") {
    if (mode === "none") {
      onChange([]);
      return;
    }
    if (mode === "role" && roleDefaults?.length) {
      onChange([...roleDefaults]);
      return;
    }
    const codes = new Set<string>();
    for (const group of groups) {
      for (const perm of group.permissions) {
        if (mode === "view" && perm.action === "view") codes.add(perm.code);
        if (mode === "full") codes.add(perm.code);
      }
    }
    onChange([...codes]);
  }

  const availableCodes = new Set(groups.flatMap((group) => group.permissions.map((perm) => perm.code)));
  const roleDefaultCount = roleDefaults?.filter((code) => availableCodes.has(code)).length ?? 0;

  if (!groups.length) {
    return (
      <div className="rounded border border-dashed border-line bg-elevated/40 px-4 py-8 text-center text-[12px] text-muted">
        No permissions are available for this role. Choose the admin role on the Assignment step first.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[180px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="w-full rounded border border-line-subtle bg-elevated py-1.5 pl-8 pr-2.5 text-[12px] outline-none focus:border-brand"
          />
        </label>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-semibold text-brand">
          {selected.length}/{total} selected
        </span>
        {roleDefaults?.length ? (
          <button
            type="button"
            className="rounded border border-brand/40 bg-brand-soft px-2 py-1 text-[10px] font-semibold text-brand"
            onClick={() => setPreset("role")}
          >
            Reset {roleLabel ? `${roleLabel} ` : ""}defaults ({roleDefaultCount})
          </button>
        ) : null}
        <button type="button" className="rounded border border-line px-2 py-1 text-[10px]" onClick={() => setPreset("view")}>
          View only
        </button>
        <button type="button" className="rounded border border-line px-2 py-1 text-[10px]" onClick={() => setPreset("full")}>
          Select all available
        </button>
        <button type="button" className="rounded border border-line px-2 py-1 text-[10px]" onClick={() => setPreset("none")}>
          Clear
        </button>
      </div>

      <p className="text-[11px] text-muted">
        {roleLabel ? (
          <>
            Standard <span className="font-semibold text-ink">{roleLabel}</span> access is pre-checked. Uncheck anything you
            do not want to grant, or use <span className="font-semibold text-ink">Reset defaults</span> to start over.
          </>
        ) : (
          <>
            Tick <span className="font-semibold text-ink">View</span>, <span className="font-semibold text-ink">Add</span>,{" "}
            <span className="font-semibold text-ink">Update</span>, and <span className="font-semibold text-ink">Delete</span>{" "}
            for each page. A dash means that action is not allowed for this admin role.
          </>
        )}
      </p>

      <div className="admin-scroll max-h-[420px] overflow-auto rounded border border-line">
        <table className="w-full min-w-[640px] text-left text-[12px]">
          <thead className="sticky top-0 bg-elevated text-[10px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Page</th>
              {COLUMNS.map((column) => (
                <th key={column.id} className="px-2 py-2 text-center font-medium">
                  {column.label}
                </th>
              ))}
              <th className="px-3 py-2 font-medium">More</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((group) => {
              const { slots, extras } = slotsFor(group);
              return (
                <tr key={group.page} className="border-t border-line hover:bg-elevated/40">
                  <td className="px-3 py-2 font-semibold text-ink">{group.label}</td>
                  {COLUMNS.map((column) => {
                    const perm = slots[column.id];
                    if (!perm) {
                      return (
                        <td key={column.id} className="px-2 py-2 text-center text-faint" title="Not available for this role">
                          —
                        </td>
                      );
                    }
                    const on = selected.includes(perm.code);
                    const disabled = Boolean(viewOnly && perm.action !== "view");
                    return (
                      <td key={column.id} className="px-2 py-2 text-center">
                        <label className="inline-flex cursor-pointer items-center justify-center">
                          <input
                            type="checkbox"
                            className="size-3.5 accent-brand"
                            checked={on}
                            disabled={disabled}
                            onChange={() => toggle(perm.code, perm.action)}
                            aria-label={`${column.label} ${group.label}`}
                          />
                        </label>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2">
                    {extras.length ? (
                      <div className="flex flex-wrap gap-1">
                        {extras.map((perm) => {
                          const on = selected.includes(perm.code);
                          const disabled = Boolean(viewOnly && perm.action !== "view");
                          return (
                            <label
                              key={`${perm.code}-${perm.label}`}
                              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${
                                on ? "border-brand bg-brand-soft text-brand" : "border-line text-muted"
                              } ${disabled ? "opacity-40" : ""}`}
                            >
                              <input
                                type="checkbox"
                                className="size-3 accent-brand"
                                checked={on}
                                disabled={disabled}
                                onChange={() => toggle(perm.code, perm.action)}
                              />
                              {perm.label}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
