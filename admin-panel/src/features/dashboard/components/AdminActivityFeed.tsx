"use client";

import { Building2, CheckCircle2, Package, UserRound } from "lucide-react";
import Link from "next/link";

import type { DashboardActivity } from "@/features/dashboard/types";

function activityIcon(module: string, action: string) {
  const text = `${module} ${action}`.toLowerCase();
  if (text.includes("stock")) return { icon: Package, tone: "bg-blue-600" };
  if (text.includes("patient") || text.includes("verif")) return { icon: CheckCircle2, tone: "bg-emerald-600" };
  if (text.includes("hospital") || text.includes("center")) return { icon: Building2, tone: "bg-blue-600" };
  return { icon: UserRound, tone: "bg-emerald-600" };
}

function formatWhen(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function activityLabel(row: DashboardActivity) {
  const action = row.action?.trim() || row.module;
  const detail = (row.detail || "").trim();
  if (!detail) return action;
  if (action.toLowerCase().includes(detail.toLowerCase())) return action;
  return `${action}: ${detail}`;
}

export function AdminActivityFeed({ items }: { items: DashboardActivity[] }) {
  return (
    <article className="panel p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[12px] font-semibold text-ink">Admin Activity</h2>
        <Link href="/dashboard/audit" className="text-[10px] font-semibold text-brand">
          View All
        </Link>
      </div>
      <div className="mt-2 flex max-h-[148px] flex-col gap-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-[11px] text-muted">No admin activity recorded yet.</p>
        ) : (
          items.map((row) => {
            const meta = activityIcon(row.module, row.action);
            const Icon = meta.icon;
            return (
              <div key={row.id} className="flex items-start gap-2 border-b border-line-subtle pb-2 last:border-0 last:pb-0">
                <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-white ${meta.tone}`}>
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[11px] font-medium text-ink">{activityLabel(row)}</p>
                  <p className="mt-0.5 truncate text-[10px] text-muted">{row.actor} · {row.module}</p>
                </div>
                <p className="w-[72px] shrink-0 text-right text-[9px] leading-tight text-faint">{formatWhen(row.createdAt)}</p>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}
