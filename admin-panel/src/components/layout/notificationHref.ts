export function hrefForNotification(note: { category: string; relatedType?: string }) {
  const topic = note.relatedType || note.category;
  if (topic === "appointment") return "/dashboard/appointments";
  if (topic === "injection" || topic === "schedule" || topic === "treatment" || topic === "bleeding" || topic === "bleeding_episode") {
    return "/dashboard/injections";
  }
  if (topic === "stock") return "/dashboard/stock";
  if (topic === "patient" || topic === "profile" || topic === "document") return "/dashboard/patients";
  if (topic === "admin") return "/dashboard/admins";
  if (topic === "website" || topic === "system") return "/dashboard/website";
  if (topic === "backup") return "/dashboard/settings";
  return "/dashboard";
}

export const PAGE_NOTIFICATION_TOPICS: Array<[string, string[]]> = [
  ["/dashboard/appointments", ["appointment"]],
  ["/dashboard/injections", ["injection", "schedule", "treatment", "bleeding", "bleeding_episode"]],
  ["/dashboard/stock", ["stock"]],
  ["/dashboard/patients", ["patient", "profile", "document"]],
  ["/dashboard/admins", ["admin"]],
  ["/dashboard/settings", ["backup"]],
];
