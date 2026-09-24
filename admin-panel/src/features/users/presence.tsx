export type PresenceState = "never" | "online" | "signed_out" | "away";

export type PresenceFields = {
  lastLogin?: string;
  lastSeen?: string;
  lastLogout?: string;
  presence?: PresenceState;
  online?: boolean;
};

export function staffPresence(row: {
  lastLoginAt?: string;
  lastSeenAt?: string;
  lastLogoutAt?: string;
  presence?: PresenceState;
}): PresenceFields {
  return { lastLogin: row.lastLoginAt, lastSeen: row.lastSeenAt, lastLogout: row.lastLogoutAt, presence: row.presence };
}

export function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function relativeTime(value?: string, now = Date.now()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

const PRESENCE_STYLE: Record<PresenceState, { dot: string; text: string }> = {
  online: { dot: "bg-emerald-500", text: "text-emerald-700" },
  away: { dot: "bg-amber-400", text: "text-muted" },
  signed_out: { dot: "bg-slate-300", text: "text-muted" },
  never: { dot: "bg-slate-200", text: "text-faint" },
};

export function presenceLabel(row: PresenceFields) {
  const state = row.presence ?? (row.lastLogin ? "away" : "never");
  if (state === "online") return "Online now";
  if (state === "never") return "Never signed in";
  if (state === "signed_out") return `Signed out ${relativeTime(row.lastLogout || row.lastSeen)}`;
  return `Active ${relativeTime(row.lastSeen || row.lastLogin)}`;
}

export function PresenceBadge({ row, compact = false }: { row: PresenceFields; compact?: boolean }) {
  const state = row.presence ?? (row.lastLogin ? "away" : "never");
  const style = PRESENCE_STYLE[state];
  const title = [
    row.lastLogin ? `Last login: ${formatDateTime(row.lastLogin)}` : "",
    row.lastSeen ? `Last active: ${formatDateTime(row.lastSeen)}` : "",
    row.lastLogout ? `Last sign-out: ${formatDateTime(row.lastLogout)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] ${style.text}`} title={title || undefined}>
      <span className={`size-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden />
      {compact && state === "online" ? "Online" : presenceLabel(row)}
    </span>
  );
}
