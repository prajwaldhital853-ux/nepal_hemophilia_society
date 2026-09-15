"use client";

import { Check, Shield } from "lucide-react";

import { KIND_DESCRIPTIONS, KIND_LABELS, type AssignableRole, type StaffKind } from "@/features/admins/api";

export default function RolePresetPicker({
  roles,
  selected,
  onSelect,
  disabled,
}: {
  roles: AssignableRole[];
  selected: StaffKind | "";
  onSelect: (kind: StaffKind) => void;
  disabled?: boolean;
}) {
  if (!roles.length) {
    return (
      <p className="rounded border border-dashed border-line bg-elevated/40 px-4 py-6 text-center text-[12px] text-muted">
        No admin roles are available for your account.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {roles.map((role) => {
        const active = selected === role.kind;
        return (
          <button
            key={role.kind}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(role.kind)}
            className={`relative rounded-lg border px-3 py-3 text-left transition-colors ${
              active
                ? "border-brand bg-brand-soft/40 ring-1 ring-brand"
                : "border-line bg-elevated/30 hover:border-brand/40 hover:bg-elevated/60"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {active ? (
              <span className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-brand text-white">
                <Check className="size-3" />
              </span>
            ) : null}
            <span className="flex items-center gap-2">
              <Shield className={`size-4 ${active ? "text-brand" : "text-muted"}`} />
              <span className="text-[12px] font-semibold text-ink">{role.label}</span>
            </span>
            <p className="mt-1.5 pr-6 text-[11px] leading-relaxed text-muted">{KIND_DESCRIPTIONS[role.kind]}</p>
            <p className="mt-2 text-[10px] font-medium text-brand">
              {role.defaults.length} permissions pre-selected — adjust on the next step
            </p>
          </button>
        );
      })}
    </div>
  );
}

export function RolePresetSummary({ kind }: { kind: StaffKind }) {
  return (
    <div className="rounded border border-brand/30 bg-brand-soft/30 px-3 py-2">
      <p className="text-[11px] font-semibold text-ink">{KIND_LABELS[kind]}</p>
      <p className="mt-0.5 text-[11px] text-muted">{KIND_DESCRIPTIONS[kind]}</p>
    </div>
  );
}
