"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Plus } from "lucide-react";

import { fetchHospitals } from "@/features/hospitals/api";
import type { HospitalOption } from "@/features/hospitals/types";
import type { FactorOption } from "@/features/injections/api";
import {
  createStockLot,
  deleteStockLot,
  fetchStock,
  fetchStockMovements,
  loadFactorCatalog,
  MOVEMENT_TYPES,
  stockIn,
  stockOut,
  updateStockLot,
  type StockLot,
  type StockMovementRow,
} from "@/features/stock/api";
import { isNationalScope, useAuth } from "@/lib/auth";
import { downloadCsv, stampFilename } from "@/lib/exportCsv";
import { Perm } from "@/lib/permissions";

const fieldClass =
  "mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand";

function when(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function roleLabel(role?: string) {
  return (role || "").replaceAll("_", " ");
}

function movementTypeClass(type: string) {
  switch (type) {
    case "stock_in":
      return "bg-emerald-50 text-emerald-700";
    case "stock_out":
      return "bg-red-50 text-red-700";
    case "adjustment":
      return "bg-sky-50 text-sky-700";
    case "injection":
      return "bg-violet-50 text-violet-700";
    case "reversal":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
}

export default function StockModule() {
  const { can, user } = useAuth();
  const canManage = can(Perm.stockManage) && !user?.viewOnly;
  const canDeleteLot = can(Perm.stockDelete) && !user?.viewOnly;
  const isSuper = isNationalScope(user);
  const canPickCenter = isSuper || user?.role === "province_admin";
  const [lots, setLots] = useState<StockLot[]>([]);
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [factors, setFactors] = useState<FactorOption[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [totalQuantity, setTotalQuantity] = useState<string | number>(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeLot, setActiveLot] = useState<StockLot | null>(null);
  const [moveMode, setMoveMode] = useState<"in" | "out" | "adjust" | null>(null);
  const [typeFilter, setTypeFilter] = useState("All");
  const [hospitalFilter, setHospitalFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [movementCursor, setMovementCursor] = useState<string | null>(null);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [stock, history] = await Promise.all([
        fetchStock({
          search,
          hospitalName: hospitalFilter !== "All" ? hospitalFilter : undefined,
          limit: 50,
        }),
        fetchStockMovements({
          type: typeFilter,
          search,
          from,
          to,
          hospitalName: hospitalFilter,
          limit: 15,
        }),
      ]);
      setLots(stock.stock ?? []);
      setTotalQuantity(stock.totalQuantity ?? 0);
      setMovements(history.movements ?? []);
      setHistoryTotal(history.total ?? 0);
      setMovementCursor(history.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load stock");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, hospitalFilter, from, to]);

  async function loadMoreMovements() {
    if (!movementCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const history = await fetchStockMovements({
        type: typeFilter,
        search,
        from,
        to,
        hospitalName: hospitalFilter,
        cursor: movementCursor,
        limit: 15,
      });
      setMovements((current) => [...current, ...(history.movements ?? [])]);
      setMovementCursor(history.nextCursor ?? null);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void load();
    void loadFactorCatalog().then(setFactors).catch(() => setFactors([]));
    if (canPickCenter) void fetchHospitals().then(setHospitals).catch(() => setHospitals([]));
  }, [load, canPickCenter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">Stock Management</h1>
          <p className="text-[11px] text-muted">Home &gt; Stock Management — live inventory by treatment center</p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white"
          >
            <Plus className="size-3.5" />
            Stock in / add lot
          </button>
        ) : (
          <p className="text-[11px] text-muted">Stock in/out is limited to your assigned province or treatment center.</p>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <article className="panel p-3">
          <p className="text-[10px] uppercase text-faint">On hand</p>
          <p className="text-[18px] font-semibold text-ink">{String(totalQuantity)}</p>
        </article>
        <article className="panel p-3">
          <p className="text-[10px] uppercase text-faint">Lots</p>
          <p className="text-[18px] font-semibold text-ink">{lots.length}</p>
        </article>
        <article className="panel p-3">
          <p className="text-[10px] uppercase text-faint">Movements shown</p>
          <p className="text-[18px] font-semibold text-ink">{movements.length}</p>
        </article>
      </div>

      {error ? <p className="text-[12px] text-red-600">{error}</p> : null}

      <article className="panel overflow-x-auto p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[12px] font-semibold text-ink">Current inventory</h2>
          <div className="flex flex-wrap items-center gap-2">
            {canPickCenter ? (
              <select
                value={hospitalFilter}
                onChange={(e) => setHospitalFilter(e.target.value)}
                className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]"
              >
                <option value="All">All centers</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.name}>
                    {h.name}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product"
              className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]"
            />
          </div>
        </div>
        {loading ? (
          <p className="text-[11px] text-muted">Loading stock…</p>
        ) : lots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Package className="size-6" />
            </span>
            <p className="text-[13px] font-semibold text-ink">No stock lots yet</p>
            <p className="max-w-md text-[12px] text-muted">
              Add a shipment (stock in) for a factor product. When a completed dose is logged, that quantity is removed
              here in real time for every admin and the patient app.
            </p>
          </div>
        ) : (
          <div className={lots.length > 6 ? "max-h-[320px] overflow-y-auto" : ""}>
          <table className="inner-table w-full text-left">
            <thead className="sticky top-0 bg-card text-[11px] uppercase text-faint">
              <tr>
                {["Product", "Center", "Batch", "On hand", "Expiry", "Last update", "Actions"].map((h) => (
                  <th key={h} className="px-2 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr key={lot.id}>
                  <td className="px-2 py-2 text-[11px]">
                    <span className="font-semibold text-ink">{lot.factorMedicineName}</span>
                    <span className="block text-[10px] text-muted">{lot.factorType}</span>
                  </td>
                  <td className="px-2 py-2 text-[11px]">
                    {lot.hospitalName}
                    <span className="block text-[10px] text-muted">{lot.province}</span>
                  </td>
                  <td className="px-2 py-2 text-[11px]">{lot.batchNumber || "—"}</td>
                  <td className="px-2 py-2 text-[11px] font-semibold">
                    {lot.quantity} {lot.unit}
                  </td>
                  <td className="px-2 py-2 text-[11px]">{lot.expiryDate || "—"}</td>
                  <td className="px-2 py-2 text-[10px] text-muted">
                    {when(lot.updatedAt)}
                    <span className="block">{lot.updatedBy?.name || lot.createdBy?.name}</span>
                  </td>
                  <td className="px-2 py-2 text-[10px]">
                    {canManage ? (
                      <div className="flex flex-wrap gap-1">
                        <button type="button" className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-emerald-700" onClick={() => { setActiveLot(lot); setMoveMode("in"); }}>
                          In
                        </button>
                        <button type="button" className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-red-700" onClick={() => { setActiveLot(lot); setMoveMode("out"); }}>
                          Out
                        </button>
                        <button type="button" className="rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-sky-700" onClick={() => { setActiveLot(lot); setMoveMode("adjust"); }}>
                          Update
                        </button>
                        {canDeleteLot ? (
                          <button
                            type="button"
                            className="rounded border border-red-200 px-1.5 py-0.5 text-red-600"
                            onClick={() => {
                              if (!window.confirm("Delete this lot? Lots with remaining quantity can only be deleted by Super Admin.")) return;
                              void deleteStockLot(lot.id).then(load).catch((err: Error) => setError(err.message));
                            }}
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      "View only"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </article>

      <article className="panel overflow-x-auto p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-[12px] font-semibold text-ink">Stock history</h2>
          {canPickCenter ? (
            <select
              value={hospitalFilter}
              onChange={(e) => {
                setHospitalFilter(e.target.value);
                setHistoryPage(1);
              }}
              className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]"
            >
              <option value="All">All centers</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name}
                </option>
              ))}
            </select>
          ) : null}
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setHistoryPage(1); }} className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]">
            {MOVEMENT_TYPES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-line-subtle bg-elevated px-2 py-1 text-[11px]" />
          <button
            type="button"
            className="rounded border border-line px-2 py-1 text-[10px] font-semibold"
            onClick={() =>
              downloadCsv(
                stampFilename("stock-history"),
                ["When", "Type", "Product", "Batch", "Qty", "Center", "Patient", "By", "Reason"],
                movements.map((row) => [
                  row.recordedAt,
                  row.movementType,
                  row.factorMedicineName,
                  row.batchNumber || "",
                  row.quantityDelta,
                  row.hospitalName,
                  row.patientId || "",
                  row.recordedBy?.name || "",
                  row.reason,
                ]),
              )
            }
          >
            Export history
          </button>
        </div>
        <table className="inner-table w-full text-left">
          <thead className="text-[11px] uppercase text-faint">
            <tr>
              {["When", "Type", "Product / batch", "Qty", "Center", "Patient", "By", "Reason"].map((h) => (
                <th key={h} className="px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-2 py-4 text-[11px] text-muted">
                  No stock movements yet.
                </td>
              </tr>
            ) : (
              movements.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 py-2 text-[10px]">{when(row.recordedAt)}</td>
                  <td className="px-2 py-2 text-[11px]">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${movementTypeClass(row.movementType)}`}>
                      {row.movementType.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-[11px]">
                    {row.factorMedicineName}
                    <span className="block text-[10px] text-muted">{row.batchNumber || "no batch"}</span>
                  </td>
                  <td className="px-2 py-2 text-[11px]">
                    {row.quantityDelta} {row.unit}
                  </td>
                  <td className="px-2 py-2 text-[11px]">{row.hospitalName}</td>
                  <td className="px-2 py-2 text-[11px]">{row.patientId ? `${row.patientId} · ${row.patientName}` : "—"}</td>
                  <td className="px-2 py-2 text-[10px]">
                    {row.recordedBy?.name}
                    <span className="block text-muted">{roleLabel(row.recordedBy?.role)}</span>
                  </td>
                  <td className="px-2 py-2 text-[11px]">{row.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted">
            {movements.length} of {historyTotal} movement(s) loaded
          </p>
          {movementCursor ? (
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void loadMoreMovements()}
              className="rounded border border-line px-2 py-1 text-[10px] font-semibold text-brand disabled:opacity-40"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>
      </article>

      {showAdd ? (
        <StockFormDialog
          title="Stock in / add lot"
          factors={factors}
          hospitals={hospitals}
          showHospital={canPickCenter}
          defaultHospital={user?.hospitalStaff?.treatmentCenter || hospitals[0]?.name || ""}
          onClose={() => setShowAdd(false)}
          onSubmit={async (payload) => {
            await createStockLot(payload);
            setShowAdd(false);
            await load();
          }}
        />
      ) : null}

      {activeLot && moveMode ? (
        <StockMoveDialog
          lot={activeLot}
          mode={moveMode}
          factors={factors}
          onClose={() => {
            setActiveLot(null);
            setMoveMode(null);
          }}
          onSubmit={async (payload) => {
            if (moveMode === "in") await stockIn(activeLot.id, payload);
            else if (moveMode === "out") await stockOut(activeLot.id, payload);
            else await updateStockLot(activeLot.id, payload);
            setActiveLot(null);
            setMoveMode(null);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

type CenterAllocRow = { hospitalName: string; quantity: string };

function StockFormDialog({
  title,
  factors,
  hospitals,
  showHospital,
  defaultHospital,
  onClose,
  onSubmit,
}: {
  title: string;
  factors: FactorOption[];
  hospitals: HospitalOption[];
  showHospital: boolean;
  defaultHospital: string;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [factorMedicineId, setFactorMedicineId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [hospitalName, setHospitalName] = useState(defaultHospital);
  const [isGlobal, setIsGlobal] = useState(showHospital);
  const [allocations, setAllocations] = useState<CenterAllocRow[]>([{ hospitalName: "", quantity: "" }]);
  const [reason, setReason] = useState("Shipment received");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        className="w-full max-w-md space-y-3 rounded border border-line bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          void onSubmit({
            factorMedicineId: Number(factorMedicineId),
            quantity,
            batchNumber,
            expiryDate: expiryDate || null,
            hospitalName: isGlobal ? undefined : hospitalName || undefined,
            isGlobal,
            centerAllocations: isGlobal
              ? allocations
                  .filter((row) => row.hospitalName && row.quantity)
                  .map((row) => ({ hospitalName: row.hospitalName, quantity: row.quantity }))
              : undefined,
            reason,
            notes,
          })
            .catch((err: Error) => setError(err.message))
            .finally(() => setBusy(false));
        }}
      >
        <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
        {showHospital ? (
          <label className="flex items-center gap-2 text-[11px]">
            <input type="checkbox" checked={isGlobal} onChange={(e) => setIsGlobal(e.target.checked)} />
            <span>Global stock — allocate to multiple treatment centers</span>
          </label>
        ) : null}
        {showHospital && !isGlobal ? (
          <label className="block text-[11px]">
            Treatment center *
            <select value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} className={fieldClass} required>
              <option value="">Select center</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {showHospital && isGlobal ? (
          <div className="space-y-2 rounded border border-line-subtle p-2">
            <p className="text-[10px] font-semibold text-muted">Center allocations</p>
            {allocations.map((row, index) => (
              <div key={index} className="grid grid-cols-[1fr_100px_auto] gap-2">
                <select
                  value={row.hospitalName}
                  onChange={(e) => {
                    const next = [...allocations];
                    next[index] = { ...next[index], hospitalName: e.target.value };
                    setAllocations(next);
                  }}
                  className={fieldClass}
                >
                  <option value="">Center</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                </select>
                <input
                  value={row.quantity}
                  onChange={(e) => {
                    const next = [...allocations];
                    next[index] = { ...next[index], quantity: e.target.value };
                    setAllocations(next);
                  }}
                  placeholder="Qty"
                  className={fieldClass}
                />
                <button
                  type="button"
                  className="rounded border border-line px-2 text-[10px]"
                  onClick={() => setAllocations(allocations.filter((_, i) => i !== index))}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-[10px] font-semibold text-brand"
              onClick={() => setAllocations([...allocations, { hospitalName: "", quantity: "" }])}
            >
              + Add center
            </button>
          </div>
        ) : null}
        <label className="block text-[11px]">
          Factor product *
          <select value={factorMedicineId} onChange={(e) => setFactorMedicineId(e.target.value)} className={fieldClass} required>
            <option value="">Select product</option>
            {factors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.unit})
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-[11px]">
            Quantity *
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} className={fieldClass} required />
          </label>
          <label className="block text-[11px]">
            Batch
            <input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} className={fieldClass} />
          </label>
        </div>
        <label className="block text-[11px]">
          Expiry
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={fieldClass} />
        </label>
        <label className="block text-[11px]">
          Reason *
          <input value={reason} onChange={(e) => setReason(e.target.value)} className={fieldClass} required />
        </label>
        <label className="block text-[11px]">
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} rows={2} />
        </label>
        {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded border border-line py-2 text-[11px] font-semibold">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="flex-1 rounded bg-brand py-2 text-[11px] font-semibold text-white">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StockMoveDialog({
  lot,
  mode,
  factors,
  onClose,
  onSubmit,
}: {
  lot: StockLot;
  mode: "in" | "out" | "adjust";
  factors: FactorOption[];
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(mode === "adjust" ? String(lot.quantity) : "");
  const [factorMedicineId, setFactorMedicineId] = useState(String(lot.factorMedicineId));
  const [batchNumber, setBatchNumber] = useState(lot.batchNumber || "");
  const [expiryDate, setExpiryDate] = useState(lot.expiryDate || "");
  const [reason, setReason] = useState(mode === "in" ? "Stock in" : mode === "out" ? "Manual stock out" : "Count correction");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        className="w-full max-w-md space-y-3 rounded border border-line bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          void onSubmit({
            quantity,
            reason,
            notes,
            ...(mode === "adjust"
              ? {
                  factorMedicineId: Number(factorMedicineId),
                  batchNumber,
                  expiryDate: expiryDate || null,
                }
              : {}),
          })
            .catch((err: Error) => setError(err.message))
            .finally(() => setBusy(false));
        }}
      >
        <h2 className="text-[14px] font-semibold text-ink">
          {mode === "in" ? "Stock in" : mode === "out" ? "Stock out" : "Update lot"} — {lot.factorMedicineName}
        </h2>
        <p className="text-[11px] text-muted">
          {lot.hospitalName} · batch {lot.batchNumber || "—"} · on hand {lot.quantity} {lot.unit}
        </p>
        {mode === "adjust" ? (
          <>
            <label className="block text-[11px]">
              Factor product
              <select value={factorMedicineId} onChange={(e) => setFactorMedicineId(e.target.value)} className={fieldClass}>
                {factors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.unit})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px]">
              Batch
              <input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} className={fieldClass} />
            </label>
            <label className="block text-[11px]">
              Expiry
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={fieldClass} />
            </label>
          </>
        ) : null}
        <label className="block text-[11px]">
          Quantity *
          <input value={quantity} onChange={(e) => setQuantity(e.target.value)} className={fieldClass} required />
        </label>
        <label className="block text-[11px]">
          Reason *
          <input value={reason} onChange={(e) => setReason(e.target.value)} className={fieldClass} required />
        </label>
        <label className="block text-[11px]">
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={fieldClass} rows={2} />
        </label>
        {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded border border-line py-2 text-[11px] font-semibold">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="flex-1 rounded bg-brand py-2 text-[11px] font-semibold text-white">
            {busy ? "Saving…" : "Confirm"}
          </button>
        </div>
      </form>
    </div>
  );
}
