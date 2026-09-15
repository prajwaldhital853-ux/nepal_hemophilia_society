"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProvinceStat } from "@/features/dashboard/types";
import { NEPAL_PROVINCES } from "@/lib/constants/provinces";
import { formatNumber } from "@/lib/format";

type Ring = number[][];
type Feature = {
  properties: { name: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: Ring[] | Ring[][] };
};

const PROVINCE_COLORS: Record<string, string> = {
  Koshi: "#93C5FD",
  Madhesh: "#FCA5A5",
  Bagmati: "#FDE68A",
  Gandaki: "#86EFAC",
  Lumbini: "#C4B5FD",
  Karnali: "#FDBA74",
  Sudurpashchim: "#67E8F9",
};

const W = 520;
const H = 236;
const PAD = 6;

function flattenRings(geom: Feature["geometry"]): Ring[] {
  if (geom.type === "Polygon") return geom.coordinates as Ring[];
  return (geom.coordinates as Ring[][]).flat();
}

function project(lon: number, lat: number, b: { minLon: number; maxLon: number; minLat: number; maxLat: number }) {
  const x = PAD + ((lon - b.minLon) / (b.maxLon - b.minLon)) * (W - PAD * 2);
  const y = PAD + (1 - (lat - b.minLat) / (b.maxLat - b.minLat)) * (H - PAD * 2);
  return [x, y] as const;
}

function centroid(rings: Ring[]) {
  const outer = rings[0] || [];
  let sx = 0;
  let sy = 0;
  const n = Math.max(outer.length, 1);
  for (const [lon, lat] of outer) {
    sx += lon;
    sy += lat;
  }
  return [sx / n, sy / n] as const;
}

export function NepalProvinceMap({
  provinceCounts = {},
  provinceStats = [],
}: {
  provinceCounts?: Record<string, number>;
  provinceStats?: ProvinceStat[];
}) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const statsLookup = useMemo(() => {
    const map: Record<string, ProvinceStat> = {};
    for (const row of provinceStats) map[row.province] = row;
    return map;
  }, [provinceStats]);

  const hoveredStat = hovered ? statsLookup[hovered] : null;
  const hoveredCount = hovered ? (provinceCounts[hovered] ?? hoveredStat?.patients ?? 0) : 0;

  useEffect(() => {
    void fetch("/nepal-provinces.geojson")
      .then((res) => res.json())
      .then((data: { features: Feature[] }) => {
        setFeatures(data.features || []);
        requestAnimationFrame(() => setReady(true));
      })
      .catch(() => setFeatures([]));
  }, []);

  const bounds = useMemo(() => {
    let minLon = 180;
    let maxLon = -180;
    let minLat = 90;
    let maxLat = -90;
    for (const feature of features) {
      for (const ring of flattenRings(feature.geometry)) {
        for (const [lon, lat] of ring) {
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      }
    }
    return { minLon, maxLon, minLat, maxLat };
  }, [features]);

  if (!features.length) {
    return <div className="flex h-[236px] items-center justify-center text-[11px] text-faint">Loading Nepal map…</div>;
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[236px] w-full overflow-visible">
        {features.map((feature) => {
          const name = feature.properties.name;
          const count = provinceCounts[name] ?? statsLookup[name]?.patients ?? 0;
          const isHovered = hovered === name;
          const color = PROVINCE_COLORS[name] ?? "#E5E7EB";
          const rings = flattenRings(feature.geometry);
          const d = rings
            .map(
              (ring) =>
                ring
                  .map((pt, i) => {
                    const [x, y] = project(pt[0], pt[1], bounds);
                    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(" ") + " Z",
            )
            .join(" ");
          const [clon, clat] = centroid(rings);
          const [lx, ly] = project(clon, clat, bounds);
          return (
            <g
              key={name}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(name)}
              onMouseLeave={() => setHovered(null)}
              style={{
                opacity: ready ? 1 : 0,
                transform: ready ? "scale(1)" : "scale(0.92)",
                transformOrigin: "center",
                transition: "opacity 700ms ease, transform 700ms ease",
              }}
            >
              <path
                d={d}
                fill={color}
                stroke={isHovered ? "#1E3A5F" : "#FFFFFF"}
                strokeWidth={isHovered ? 2 : 1.2}
              />
              <text x={lx} y={ly - 4} textAnchor="middle" className="pointer-events-none fill-navy-900" fontSize="8" fontWeight="700">
                {name}
              </text>
              <text x={lx} y={ly + 6} textAnchor="middle" className="pointer-events-none fill-navy-800" fontSize="9" fontWeight="800">
                {count ? formatNumber(count) : ""}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered ? (
        <div className="pointer-events-none absolute left-2 top-2 z-10 min-w-[210px] rounded-lg border border-line-subtle bg-elevated p-3 shadow-lg">
          <p className="text-[12px] font-semibold text-ink">{hovered}</p>
          {hoveredStat ? (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]">
              <div>
                <dt className="text-muted">Patients</dt>
                <dd className="font-semibold text-ink">{formatNumber(hoveredStat.patients)}</dd>
              </div>
              <div>
                <dt className="text-muted">Active</dt>
                <dd className="font-semibold text-status-green">{formatNumber(hoveredStat.activePatients)}</dd>
              </div>
              <div>
                <dt className="text-muted">Pending</dt>
                <dd className="font-semibold text-ink">{formatNumber(hoveredStat.pendingPatients ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-muted">Centers</dt>
                <dd className="font-semibold text-ink">{formatNumber(hoveredStat.hospitals)}</dd>
              </div>
              <div>
                <dt className="text-muted">Hemophilia A</dt>
                <dd className="font-semibold text-ink">{formatNumber(hoveredStat.hemophiliaA ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-muted">Hemophilia B</dt>
                <dd className="font-semibold text-ink">{formatNumber(hoveredStat.hemophiliaB ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-muted">Severe</dt>
                <dd className="font-semibold text-ink">{formatNumber(hoveredStat.severe ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-muted">Injections</dt>
                <dd className="font-semibold text-ink">{formatNumber(hoveredStat.injections)}</dd>
              </div>
              <div>
                <dt className="text-muted">Treatments</dt>
                <dd className="font-semibold text-ink">{formatNumber(hoveredStat.treatments ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-muted">Stock on hand</dt>
                <dd className="font-semibold text-ink">{formatNumber(hoveredStat.stockUnits)}</dd>
              </div>
              <div>
                <dt className="text-muted">Stock in</dt>
                <dd className="font-semibold text-status-green">{formatNumber(hoveredStat.stockIn ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-muted">Stock out / used</dt>
                <dd className="font-semibold text-ink">{formatNumber(hoveredStat.stockOut ?? 0)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-1 text-[11px] font-semibold text-ink">{formatNumber(hoveredCount)} patients</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export { NEPAL_PROVINCES };
