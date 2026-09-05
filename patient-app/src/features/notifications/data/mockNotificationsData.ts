export type NotificationFilterId =
  | "all"
  | "appointments"
  | "treatments"
  | "events"
  | "updates"
  | "system";

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
  badge?: number;
}[] = [
  { id: "all", label: "All", icon: "bell", badge: 3 },
  { id: "appointments", label: "Appointments", icon: "calendar" },
  { id: "treatments", label: "Treatments", icon: "needle" },
  { id: "events", label: "Events", icon: "megaphone" },
  { id: "updates", label: "Updates", icon: "document" },
  { id: "system", label: "System", icon: "settings" },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    section: "today",
    category: "appointments",
    title: "Upcoming Appointment",
    body: "You have an appointment tomorrow at 10:00 AM at TU Teaching Hospital, Hemophilia Center.",
    time: "2 hours ago",
    unread: true,
    variant: "appointment",
    icon: "calendar",
    badge: { label: "Reminder", tone: "red" },
  },
  {
    id: "n2",
    section: "today",
    category: "treatments",
    title: "Injection Due",
    body: "Your next factor injection is due tomorrow. Stay on track for a healthier tomorrow.",
    time: "4 hours ago",
    unread: true,
    variant: "injection",
    icon: "needle",
    badge: { label: "Action Required", tone: "red" },
  },
  {
    id: "n3",
    section: "today",
    category: "updates",
    title: "Factor Stock Update",
    body: "Factor VIII stock has been updated. 5,000 IU is now available at NHS Central Store.",
    time: "6 hours ago",
    unread: true,
    variant: "stock",
    icon: "water",
    badge: { label: "Good News", tone: "green" },
  },
  {
    id: "n4",
    section: "yesterday",
    category: "updates",
    title: "New Educational Resource",
    body: "A new guide on 'Managing Bleeds at Home' is now available. Check it out!",
    time: "1 day ago",
    unread: false,
    variant: "plain",
    icon: "document",
  },
  {
    id: "n5",
    section: "yesterday",
    category: "events",
    title: "Upcoming Awareness Event",
    body: "Join us for World Hemophilia Day 2025 on 17 April 2025 at Bhrikutimandap, Kathmandu.",
    time: "1 day ago",
    unread: false,
    variant: "plain",
    icon: "megaphone",
  },
  {
    id: "n6",
    section: "yesterday",
    category: "updates",
    title: "Community Message",
    body: "A new support group discussion has been posted in the community section.",
    time: "1 day ago",
    unread: false,
    variant: "plain",
    icon: "people",
  },
  {
    id: "n7",
    section: "week",
    category: "system",
    title: "System Update",
    body: "The app has been updated with new features and performance improvements.",
    time: "3 days ago",
    unread: false,
    variant: "plain",
    icon: "shield",
  },
  {
    id: "n8",
    section: "week",
    category: "system",
    title: "Help & Support",
    body: "Need assistance? Our support team is here for you. Contact us anytime.",
    time: "4 days ago",
    unread: false,
    variant: "plain",
    icon: "call",
  },
];
