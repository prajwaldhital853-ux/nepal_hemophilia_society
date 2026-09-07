"use client";

import { useEffect, useMemo, useState } from "react";

import { provinceStats } from "@/features/dashboard/data/mockDashboard";
import { formatNumber } from "@/lib/format";

type Ring = number[][];
type Feature = {
  properties: { name: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: Ring[] | Ring[][] };
};

const W = 420;
const H = 200;
const PAD = 10;

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

export function NepalProvinceMap() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [ready, setReady] = useState(false);

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
    return <div className="flex h-[200px] items-center justify-center text-[11px] text-faint">Loading Nepal map…</div>;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full overflow-visible">
      {features.map((feature) => {
        const stat = provinceStats.find((p) => p.name === feature.properties.name);
        const rings = flattenRings(feature.geometry);
        const d = rings
          .map((ring) =>
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
            key={feature.properties.name}
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "scale(1)" : "scale(0.92)",
              transformOrigin: "center",
              transition: "opacity 700ms ease, transform 700ms ease",
            }}
          >
            <path d={d} fill={stat?.color || "#93C5FD"} stroke="#FFFFFF" strokeWidth="1.2" />
            <text x={lx} y={ly - 4} textAnchor="middle" className="fill-navy-900" fontSize="8" fontWeight="700">
              {feature.properties.name}
            </text>
            <text x={lx} y={ly + 6} textAnchor="middle" className="fill-navy-800" fontSize="9" fontWeight="800">
              {stat ? formatNumber(stat.count) : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
