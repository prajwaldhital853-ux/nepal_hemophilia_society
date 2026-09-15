import type { BleedingEpisode } from "@/core/providers/PatientClinicalStatsProvider";

export type BleedingProfileSummary = {
  joints: string[];
  mostAffected: string;
  severity: string;
  totalEpisodes: number;
  lastBleed: string;
  hasData: boolean;
};

function formatBleedDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const EMPTY: BleedingProfileSummary = {
  joints: ["", "", ""],
  mostAffected: "—",
  severity: "—",
  totalEpisodes: 0,
  lastBleed: "—",
  hasData: false,
};

export function buildBleedingProfile(episodes: BleedingEpisode[]): BleedingProfileSummary {
  if (!episodes.length) return EMPTY;

  const year = new Date().getFullYear();
  const sorted = [...episodes].sort(
    (a, b) => new Date(b.episodeDate).getTime() - new Date(a.episodeDate).getTime(),
  );
  const latest = sorted[0];
  const totalEpisodes = episodes.filter((episode) => {
    const d = new Date(episode.episodeDate);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === year;
  }).length;

  const siteCounts = new Map<string, number>();
  for (const episode of episodes) {
    const site = episode.site?.trim();
    if (!site) continue;
    siteCounts.set(site, (siteCounts.get(site) ?? 0) + 1);
  }

  const rankedSites = [...siteCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([site]) => site);

  const joints = rankedSites.slice(0, 3);
  while (joints.length < 3) joints.push("");

  const mostAffected = rankedSites[0] ?? latest.site?.trim() ?? "—";
  const severity = latest.severity?.trim() || "—";

  return {
    joints,
    mostAffected,
    severity,
    totalEpisodes,
    lastBleed: formatBleedDate(latest.episodeDate),
    hasData: true,
  };
}
