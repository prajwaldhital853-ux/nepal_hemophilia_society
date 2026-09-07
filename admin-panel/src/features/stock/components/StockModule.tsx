"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownUp,
  CalendarRange,
  ChevronDown,
  Download,
  Eye,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  allStockItems,
  categories,
  categoryDistribution,
  recentActivity,
  stockMovement,
  stockOverview,
  stockStatus as stockStatusOptions,
  stockTotals,
  type StockStatus,
} from "@/features/stock/data/mockStock";
import { formatNumber } from "@/lib/format";
import { useChartColors } from "@/lib/chartColors";

function statusClass(status: StockStatus) {
  if (status === "In Stock") return "bg-status-green-soft text-status-green";
  if (status === "Low Stock") return "bg-status-amber-soft text-status-amber";
  if (status === "Out of Stock") return "bg-elevated text-muted";
  return "bg-red-50 text-red-600 dark:bg-red-500/10";
}

export default function StockModule() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [openCategory, setOpenCategory] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const c = useChartColors();

  const rows = useMemo(() => {
    return allStockItems.filter((item) => {
      const matchCategory = category === "All" || item.category === category;
      const matchStatus = status === "All" || item.status === status;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.batchNumber.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);
      return matchCategory && matchStatus && matchQuery;
    });
  }, [category, status, query]);

  const total = stockTotals[category as keyof typeof stockTotals] ?? rows.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Stock Management</h1>
          <p className="text-[11px] text-muted">Home &gt; Stock Management</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="panel flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted">
            <CalendarRange className="size-3.5" />
            May 16, 2025
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
          >
            <Plus className="size-3.5" />
            Add Stock
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <article className="panel flex gap-2 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
            <Package className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted">Total Items</p>
            <p className="mt-0.5 text-[15px] font-semibold text-ink">{stockOverview.totalItems}</p>
          </div>
        </article>

        <article className="panel flex gap-2 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
            <TrendingUp className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted">Total Value</p>
            <p className="mt-0.5 text-[15px] font-semibold text-ink">{stockOverview.totalValue}</p>
          </div>
        </article>

        <article className="panel flex gap-2 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
            <AlertCircle className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted">Low Stock</p>
            <p className="mt-0.5 text-[15px] font-semibold text-ink">{stockOverview.lowStockItems}</p>
          </div>
        </article>

        <article className="panel flex gap-2 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-red-500/10 text-red-500">
            <TrendingDown className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted">Expiring Soon</p>
            <p className="mt-0.5 text-[15px] font-semibold text-ink">{stockOverview.expiringItems}</p>
          </div>
        </article>

        <article className="panel flex gap-2 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-500/10 text-slate-500">
            <Package className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted">Out of Stock</p>
            <p className="mt-0.5 text-[15px] font-semibold text-ink">{stockOverview.outOfStock}</p>
          </div>
        </article>

        <article className="panel flex gap-2 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-500">
            <ArrowDownUp className="size-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted">Locations</p>
            <p className="mt-0.5 text-[15px] font-semibold text-ink">{stockOverview.locations}</p>
          </div>
        </article>
      </div>

      {/* Charts Section */}
      <div className="grid gap-2 lg:grid-cols-2">
        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Stock Movement (Last 5 Months)</h2>
          <ResponsiveContainer width="100%" height={180} className="mt-2">
            <LineChart data={stockMovement}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis dataKey="month" stroke={c.tick} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={c.tick} fontSize={10} width={35} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: c.tooltipBg,
                  border: `1px solid ${c.tooltipBorder}`,
                  borderRadius: 4,
                  fontSize: 11,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="in"
                name="Stock In"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ r: 3, fill: c.tooltipBg, stroke: "#22C55E", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="out"
                name="Stock Out"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 3, fill: c.tooltipBg, stroke: "#EF4444", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="panel p-3">
          <h2 className="text-[12px] font-semibold text-ink">Stock by Category</h2>
          <div className="mt-2 flex items-center gap-4">
            <ResponsiveContainer width="50%" height={140}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  dataKey="value"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                  stroke="none"
                >
                  {categoryDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-1 flex-col gap-1.5 text-[10px]">
              {categoryDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: item.color }} />
                    <span className="text-muted">{item.name}</span>
                  </div>
                  <span className="font-semibold text-ink">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* Recent Activity */}
      <article className="panel p-3">
        <h2 className="text-[12px] font-semibold text-ink">Recent Activity</h2>
        <div className="mt-2 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {recentActivity.map((activity, idx) => (
            <div key={idx} className="panel-inset flex items-start gap-2 p-2 shadow-none">
              <Package className="mt-0.5 size-3.5 shrink-0 text-brand" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-ink">{activity.action}</p>
                <p className="text-[10px] text-muted">{activity.item}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-brand">{activity.quantity}</span>
                  <span className="text-[9px] text-faint">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Stock Table */}
      <section className="panel overflow-hidden">
        <div className="filter-bar">
          <label className="panel-inset flex h-8 min-w-[200px] flex-1 items-center gap-2 px-2.5 shadow-none">
            <Search className="size-3.5 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-[11px] text-ink outline-none placeholder:text-faint"
              placeholder="Search by Name, Batch Number or Location..."
            />
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenCategory((v) => !v);
                setOpenStatus(false);
              }}
              className="panel flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
            >
              {category}
              <ChevronDown className="size-3.5" />
            </button>
            {openCategory ? (
              <div className="absolute z-20 mt-1 w-48 overflow-hidden panel shadow-lg">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-brand-soft ${
                      category === item ? "bg-brand text-white hover:bg-brand" : ""
                    }`}
                    onClick={() => {
                      setCategory(item);
                      setOpenCategory(false);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenStatus((v) => !v);
                setOpenCategory(false);
              }}
              className="panel flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none"
            >
              {status}
              <ChevronDown className="size-3.5" />
            </button>
            {openStatus ? (
              <div className="absolute z-20 mt-1 w-40 overflow-hidden panel shadow-lg">
                {stockStatusOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-brand-soft ${
                      status === item ? "bg-brand text-white hover:bg-brand" : ""
                    }`}
                    onClick={() => {
                      setStatus(item);
                      setOpenStatus(false);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {(category !== "All" || status !== "All") && (
            <div className="flex items-center gap-1">
              {category !== "All" && (
                <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
                  {category}
                  <button type="button" onClick={() => setCategory("All")} aria-label="Clear category">
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {status !== "All" && (
                <span className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
                  {status}
                  <button type="button" onClick={() => setStatus("All")} aria-label="Clear status">
                    <X className="size-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          <p className="text-[11px] text-muted">
            Total: <span className="text-[15px] font-semibold text-ink">{formatNumber(total)}</span>
          </p>

          <button type="button" className="panel ml-auto flex h-8 items-center gap-1.5 px-2.5 text-[11px] text-muted shadow-none">
            <Download className="size-3.5" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-elevated text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {[
                  "Stock ID",
                  "Item Name",
                  "Category",
                  "Batch No.",
                  "Quantity",
                  "Location",
                  "Expiry Date",
                  "Status",
                  "Actions",
                ].map((h) => (
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
                  <td className="px-3 py-3 font-semibold text-ink">{row.name}</td>
                  <td className="px-3 py-3 text-muted">{row.category}</td>
                  <td className="px-3 py-3 text-ink">{row.batchNumber}</td>
                  <td className="px-3 py-3 font-medium text-ink">
                    {formatNumber(row.quantity)} {row.unit}
                  </td>
                  <td className="px-3 py-3 text-muted">{row.location}</td>
                  <td className="px-3 py-3 text-muted">{row.expiryDate}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1 text-muted">
                      <button
                        type="button"
                        className="rounded-lg p-1.5 text-brand hover:bg-brand-soft"
                        aria-label={`View ${row.name}`}
                      >
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

        <div className="table-footer flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <p>
            Showing 1 to {Math.min(rows.length, 10)} of {formatNumber(total)} entries
          </p>
          <div className="flex items-center gap-1">
            {["1", "2", "3", "..."].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className={`flex size-7 items-center justify-center rounded text-[11px] ${
                  item === "1" ? "bg-brand font-semibold text-white" : "panel shadow-none"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
