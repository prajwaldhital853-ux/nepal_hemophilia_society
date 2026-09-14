export type BleedingCallout = {
  label: string;
  jx: number;
  jy: number;
  ex: number;
  ey: number;
};

type SiteAnchor = Omit<BleedingCallout, "label">;

/** Anchor points on the 178×168 body map PNG (patient's right = image left). */
const SITE_ANCHORS: Record<string, SiteAnchor> = {
  right_hand: { jx: 42, jy: 72, ex: 8, ey: 58 },
  left_hand: { jx: 128, jy: 72, ex: 168, ey: 58 },
  right_elbow: { jx: 52, jy: 58, ex: 12, ey: 42 },
  left_elbow: { jx: 118, jy: 58, ex: 158, ey: 42 },
  right_shoulder: { jx: 58, jy: 42, ex: 18, ey: 28 },
  left_shoulder: { jx: 112, jy: 42, ex: 152, ey: 28 },
  right_knee: { jx: 68, jy: 112, ex: 28, ey: 112 },
  left_knee: { jx: 102, jy: 112, ex: 142, ey: 112 },
  right_ankle: { jx: 62, jy: 150, ex: 22, ey: 150 },
  left_ankle: { jx: 108, jy: 150, ex: 148, ey: 150 },
  right_foot: { jx: 58, jy: 158, ex: 18, ey: 162 },
  left_foot: { jx: 112, jy: 158, ex: 152, ey: 162 },
  hip: { jx: 88, jy: 98, ex: 88, ey: 78 },
  other: { jx: 88, jy: 88, ex: 88, ey: 68 },
};

function classifySite(site: string): string {
  const s = site.toLowerCase().replace(/[_-]/g, " ").trim();
  const isRight = /\bright\b/.test(s) || /\br\b/.test(s);
  const isLeft = /\bleft\b/.test(s) || /\bl\b/.test(s);

  if ((isRight || isLeft) && /hand|wrist|finger|palm/.test(s)) {
    return isRight ? "right_hand" : "left_hand";
  }
  if ((isRight || isLeft) && /elbow/.test(s)) return isRight ? "right_elbow" : "left_elbow";
  if ((isRight || isLeft) && /shoulder/.test(s)) return isRight ? "right_shoulder" : "left_shoulder";
  if ((isRight || isLeft) && /knee/.test(s)) return isRight ? "right_knee" : "left_knee";
  if ((isRight || isLeft) && /ankle/.test(s)) return isRight ? "right_ankle" : "left_ankle";
  if ((isRight || isLeft) && /foot|toe/.test(s)) return isRight ? "right_foot" : "left_foot";
  if (/hip|groin/.test(s)) return "hip";

  if (/hand|wrist|finger/.test(s)) return "right_hand";
  if (/elbow/.test(s)) return "right_elbow";
  if (/knee/.test(s)) return "right_knee";
  if (/ankle|foot/.test(s)) return "left_foot";
  return "other";
}

export function buildBleedingCallouts(sites: string[]): BleedingCallout[] {
  const seen = new Set<string>();
  const callouts: BleedingCallout[] = [];

  for (const raw of sites) {
    const label = raw.trim();
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    const key = classifySite(label);
    const anchor = SITE_ANCHORS[key] ?? SITE_ANCHORS.other;
    callouts.push({ label, ...anchor });
    if (callouts.length >= 3) break;
  }

  return callouts;
}
