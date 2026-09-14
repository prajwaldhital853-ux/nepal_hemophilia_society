export type NotificationFilterId = "all" | "appointments" | "treatments" | "events" | "updates" | "system";

export type NotificationSectionId = "today" | "yesterday" | "week";

export type NotificationVariant = "appointment" | "injection" | "stock" | "plain";

export type NotificationIconName =
  | "calendar"
  | "needle"
  | "water"
  | "document"
  | "megaphone"
  | "people"
  | "shield"
  | "call";

export type NotificationItem = {
  id: string;
  section: NotificationSectionId;
  category: Exclude<NotificationFilterId, "all">;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  variant: NotificationVariant;
  icon: NotificationIconName;
  badge?: {
    label: string;
    tone: "red" | "green";
  };
};

export const notificationFilters: {
  id: NotificationFilterId;
  label: string;
  icon: "bell" | "calendar" | "needle" | "megaphone" | "document" | "settings";
}[] = [
  { id: "all", label: "All", icon: "bell" },
  { id: "appointments", label: "Appointments", icon: "calendar" },
  { id: "treatments", label: "Treatments", icon: "needle" },
  { id: "events", label: "Events", icon: "megaphone" },
  { id: "updates", label: "Updates", icon: "document" },
  { id: "system", label: "System", icon: "settings" },
];
