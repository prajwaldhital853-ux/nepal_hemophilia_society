import type { BleedingEpisode } from "@/core/providers/PatientClinicalStatsProvider";
import { buildBleedingCallouts, type BleedingCallout } from "@/features/home/utils/bleedingBodyMap";

export type BleedingProfileSummary = {
  callouts: BleedingCallout[];
  mostAffected: string;
  severity: string;
  totalEpisodes: number;
  lastBleed: string;
  hasData: boolean;
  episodes: BleedingEpisode[];
};

function formatBleedDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const EMPTY: BleedingProfileSummary = {
  callouts: [],
  mostAffected: "—",
  severity: "—",
  totalEpisodes: 0,
  lastBleed: "—",
  hasData: false,
  episodes: [],
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

  const calloutSites = rankedSites.length ? rankedSites : [latest.site?.trim() ?? ""].filter(Boolean);
  const mostAffected = rankedSites[0] ?? latest.site?.trim() ?? "—";
  const severity = latest.severity?.trim() || "—";

  return {
    callouts: buildBleedingCallouts(calloutSites),
    mostAffected,
    severity,
    totalEpisodes,
    lastBleed: formatBleedDate(latest.episodeDate),
    hasData: true,
    episodes: sorted,
  };
}
