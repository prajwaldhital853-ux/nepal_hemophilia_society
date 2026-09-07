"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Download, Eye, MoreHorizontal, Plus, Search, Shield, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { allUsers, loginTrend, roleMix, userRoles, userStats, type UserRole, type UserStatus } from "@/features/users/data/mockUsers";
import { formatNumber } from "@/lib/format";
import { useChartColors } from "@/lib/chartColors";

function statusClass(status: UserStatus) {
  if (status === "Active") return "bg-status-green-soft text-status-green";
  if (status === "Pending") return "bg-status-amber-soft text-status-amber";
  return "bg-elevated text-muted";
}

export default function UsersModule() {
  const c = useChartColors();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<UserRole | "All">("All");
  const [openRole, setOpenRole] = useState(false);

  const rows = useMemo(() => {
    return allUsers.filter((user) => {
      const matchRole = role === "All" || user.role === role;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [query, role]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Users Management</h1>
          <p className="text-[11px] text-muted">Super Admin only — national account directory. Home &gt; Users Management</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
        >
          <Plus className="size-3.5" />
          Invite User
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <article className="panel flex gap-2 p-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-brand-soft text-brand">
            <Users className="size-3.5" />
          </span>
          <div>
            <p className="text-[10px] text-muted">Directory</p>
            <p className="text-[15px] font-semibold text-ink">{formatNumber(userStats.total)}</p>
          </div>
        </article>
        <article className="panel flex gap-2 p-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
            <Users className="size-3.5" />
          </span>
          <div>
            <p className="text-[10px] text-muted">Active</p>
            <p className="text-[15px] font-semibold text-ink">{formatNumber(userStats.active)}</p>
          </div>
        </article>
        <article className="panel flex gap-2 p-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-status-amber-soft text-status-amber">
            <Shield className="size-3.5" />
          </span>
          <div>
            <p className="text-[10px] text-muted">Pending invites</p>
            <p className="text-[15px] font-semibold text-ink">{userStats.pending}</p>
          </div>
        </article>
        <article className="panel flex gap-2 p-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-elevated text-muted">
            <Shield className="size-3.5" />
          </span>
          <div>
            <p className="text-[10px] text-muted">Suspended</p>
            <p className="text-[15px] font-semibold text-ink">{userStats.suspended}</p>
          </div>
        </article>
        <article className="panel flex gap-2 p-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-brand-soft text-brand">
            <Users className="size-3.5" />
          </span>
          <div>
            <p className="text-[10px] text-muted">Live sessions</p>
            <p className="text-[15px] font-semibold text-ink">{userStats.sessions}</p>
          </div>
        </article>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Logins this week</h2>
          <ResponsiveContainer width="100%" height={168} className="mt-2">
            <AreaChart data={loginTrend}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="day" stroke={c.tick} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={c.tick} fontSize={10} width={28} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: c.tooltipBg,
                  border: `1px solid ${c.tooltipBorder}`,
                  borderRadius: 4,
                  fontSize: 11,
                }}
              />
              <Area type="monotone" dataKey="logins" stroke="#2F6FED" fill="rgba(47, 111, 237, 0.18)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </article>
        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Role mix</h2>
          <div className="mt-2 flex items-center gap-3">
            <ResponsiveContainer width="46%" height={150}>
              <PieChart>
                <Pie data={roleMix} dataKey="value" innerRadius={36} outerRadius={58} paddingAngle={2} stroke="none">
                  {roleMix.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="flex flex-1 flex-col gap-1.5 text-[10px]">
              {roleMix.map((item) => (
                <li key={item.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="size-2 rounded-full" style={{ background: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-semibold text-ink">{item.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>

      <section className="panel overflow-hidden">
        <div className="filter-bar">
          <label className="panel-inset flex h-8 min-w-[200px] flex-1 items-center gap-2 px-2.5 shadow-none">
            <Search className="size-3.5 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
              placeholder="Search name, email or user ID..."
            />
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenRole((v) => !v)}
              className="panel flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
            >
              {role === "All" ? "All roles" : role}
              <ChevronDown className="size-3.5" />
            </button>
            {openRole ? (
              <div className="absolute z-20 mt-1 w-44 overflow-hidden panel shadow-lg">
                {userRoles.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-brand-soft ${
                      role === item ? "bg-brand text-white hover:bg-brand" : ""
                    }`}
                    onClick={() => {
                      setRole(item);
                      setOpenRole(false);
                    }}
                  >
                    {item === "All" ? "All roles" : item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" className="panel ml-auto flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none">
            <Download className="size-3.5" />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[880px] text-left text-sm">
            <thead className="bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {["User ID", "Name", "Role", "Province", "Last active", "Sessions", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-3 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-elevated/70 dark:hover:bg-white/[0.03]">
                  <td className="px-3 py-3 font-medium text-brand">{row.id}</td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-ink">{row.name}</p>
                    <p className="text-[10px] text-muted">{row.email}</p>
                  </td>
                  <td className="px-3 py-3 text-ink">{row.role}</td>
                  <td className="px-3 py-3 text-muted">{row.province}</td>
                  <td className="px-3 py-3 text-muted">{row.lastActive}</td>
                  <td className="px-3 py-3 text-ink">{row.sessions}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 text-muted">
                      <button type="button" className="rounded-lg p-1.5 text-brand hover:bg-brand-soft" aria-label="View">
                        <Eye className="size-[15px]" />
                      </button>
                      <button type="button" className="rounded-lg p-1.5 hover:bg-elevated" aria-label="More">
                        <MoreHorizontal className="size-[15px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
