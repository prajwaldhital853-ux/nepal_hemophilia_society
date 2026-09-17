export type ProfileMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: "person" | "people" | "medical" | "calendar" | "notifications" | "settings" | "help" | "logout";
    action?: "profile" | "documents" | "events" | "notifications" | "settings" | "help" | "logout" | "community";
};

export const profileMenuItems: ProfileMenuItem[] = [
  {
    id: "profile",
    title: "My Profile",
    subtitle: "View your emergency ID card",
    icon: "person",
    action: "profile",
  },
  {
    id: "family",
    title: "Family Members",
    subtitle: "Managed with your treatment centre",
    icon: "people",
    action: "community",
  },
  {
    id: "medical",
    title: "Medical Information",
    subtitle: "View your medical records",
    icon: "medical",
    action: "documents",
  },
  {
    id: "appointments",
    title: "Appointments",
    subtitle: "NHS events and sessions",
    icon: "calendar",
    action: "events",
  },
  {
    id: "notifications",
    title: "Notifications",
    subtitle: "View your alerts and updates",
    icon: "notifications",
    action: "notifications",
  },
  {
    id: "settings",
    title: "Settings",
    subtitle: "App preferences and privacy",
    icon: "settings",
    action: "settings",
  },
  {
    id: "help",
    title: "Help & Support",
    subtitle: "Get support and FAQs",
    icon: "help",
    action: "help",
  },
  {
    id: "logout",
    title: "Logout",
    subtitle: "Sign out from your account",
    icon: "logout",
    action: "logout",
  },
];
