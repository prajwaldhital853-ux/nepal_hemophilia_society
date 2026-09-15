"use client";

import { Activity, Eye, HeartPulse, Users } from "lucide-react";

import type { SystemOverview } from "@/features/dashboard/types";
import { formatNumber } from "@/lib/format";

const cards = [
  { key: "totalUsers", label: "Total Users", icon: Users, tone: "text-blue-600" },
  { key: "activeSessions", label: "Active Sessions", icon: Activity, tone: "text-emerald-600" },
  { key: "todaysVisits", label: "Today's Visits", icon: Eye, tone: "text-sky-600" },
  { key: "uptime", label: "System Uptime", icon: HeartPulse, tone: "text-red-500" },
] as const;

export function SystemOverviewSection({ overview }: { overview: SystemOverview }) {
  const values: Record<string, string> = {
    totalUsers: formatNumber(overview.totalUsers),
    activeSessions: formatNumber(overview.activeSessions),
    todaysVisits: formatNumber(overview.todaysVisits),
    uptime: overview.uptime || "Online",
  };

  return (
    <article className="panel p-3">
      <h2 className="text-[12px] font-semibold text-ink">System Overview</h2>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="flex items-center gap-2.5">
              <Icon className={`size-5 shrink-0 ${card.tone}`} strokeWidth={2.2} />
              <div className="min-w-0">
                <p className="text-[10px] text-muted">{card.label}</p>
                <p className="text-[16px] font-bold leading-5 text-ink">{values[card.key]}</p>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
