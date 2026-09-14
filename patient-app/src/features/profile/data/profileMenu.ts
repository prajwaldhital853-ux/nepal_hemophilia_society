export type ProfileMenuItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: "person" | "people" | "medical" | "calendar" | "notifications" | "settings" | "help" | "logout";
  action?: "notifications" | "logout";
};

export const profileMenuItems: ProfileMenuItem[] = [
  {
    id: "profile",
    title: "My Profile",
    subtitle: "View and edit your information",
    icon: "person",
  },
  {
    id: "family",
    title: "Family Members",
    subtitle: "Manage your family details",
    icon: "people",
  },
  {
    id: "medical",
    title: "Medical Information",
    subtitle: "View your medical records",
    icon: "medical",
  },
  {
    id: "appointments",
    title: "Appointments",
    subtitle: "Manage your appointments",
    icon: "calendar",
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
  },
  {
    id: "help",
    title: "Help & Support",
    subtitle: "Get support and FAQs",
    icon: "help",
  },
  {
    id: "logout",
    title: "Logout",
    subtitle: "Sign out from your account",
    icon: "logout",
    action: "logout",
  },
];
