export type BleedSiteCallout = {
  label: string;
  jx: number;
  jy: number;
  ex: number;
  ey: number;
};

/** Map positions on bleeding-body-map.png (178x168 viewBox). */
const SITE_POSITIONS: Record<string, Omit<BleedSiteCallout, "label">> = {
  elbow: { jx: 98, jy: 59, ex: 146, ey: 40 },
  knee: { jx: 83, jy: 111, ex: 100, ey: 111 },
  ankle: { jx: 57, jy: 150, ex: 100, ey: 150 },
  hip: { jx: 72, jy: 98, ex: 100, ey: 98 },
  shoulder: { jx: 108, jy: 48, ex: 146, ey: 48 },
  wrist: { jx: 112, jy: 72, ex: 146, ey: 72 },
  calf: { jx: 64, jy: 132, ex: 100, ey: 132 },
};

function resolveSiteKey(site: string): string | null {
  const value = site.toLowerCase();
  if (value.includes("elbow")) return "elbow";
  if (value.includes("ankle") || value.includes("foot")) return "ankle";
  if (value.includes("knee")) return "knee";
  if (value.includes("hip")) return "hip";
  if (value.includes("shoulder")) return "shoulder";
  if (value.includes("wrist")) return "wrist";
  if (value.includes("calf") || value.includes("muscle")) return "calf";
  return null;
}

/** Place each ranked bleed site on the correct body landmark (not by list index). */
export function calloutsForBleedSites(rankedSites: string[]): BleedSiteCallout[] {
  const used = new Set<string>();
  const callouts: BleedSiteCallout[] = [];

  for (const site of rankedSites) {
    const label = site.trim();
    if (!label) continue;

    const key = resolveSiteKey(label);
    if (!key || used.has(key)) continue;

    const position = SITE_POSITIONS[key];
    if (!position) continue;

    used.add(key);
    callouts.push({ label, ...position });
    if (callouts.length >= 3) break;
  }

  return callouts;
}
