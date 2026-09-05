import type { Ionicons } from "@expo/vector-icons";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

export type ServiceIcon =
  | { set: "ion"; name: keyof typeof Ionicons.glyphMap }
  | { set: "mci"; name: keyof typeof MaterialCommunityIcons.glyphMap };

export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  icon: ServiceIcon;
};

export type ServiceCategory = {
  id: string;
  title: string;
  services: ServiceItem[];
};

export const mockServiceCategories: ServiceCategory[] = [
  {
    id: "treatment",
    title: "Treatment & Health Management",
    services: [
      {
        id: "treatment-history",
        title: "Treatment History",
        description: "View your past treatments",
        icon: { set: "mci", name: "water-plus" },
      },
      {
        id: "injection-logs",
        title: "Injection Logs",
        description: "Track your injections",
        icon: { set: "mci", name: "needle" },
      },
      {
        id: "upcoming-events",
        title: "Upcoming Events",
        description: "See appointments and events",
        icon: { set: "ion", name: "calendar-outline" },
      },
      {
        id: "health-records",
        title: "Health Records",
        description: "Manage your medical information",
        icon: { set: "mci", name: "clipboard-pulse-outline" },
      },
      {
        id: "bleeding-history",
        title: "Bleeding History",
        description: "Record and analyze bleeds",
        icon: { set: "mci", name: "water" },
      },
      {
        id: "factor-stock",
        title: "Factor Stock",
        description: "Check factor availability",
        icon: { set: "mci", name: "pill" },
      },
      {
        id: "analytics",
        title: "Analytics",
        description: "View your health trends and reports",
        icon: { set: "mci", name: "chart-line" },
      },
      {
        id: "emergency-support",
        title: "Emergency Support",
        description: "Get help in emergencies",
        icon: { set: "mci", name: "shield-plus-outline" },
      },
    ],
  },
  {
    id: "education",
    title: "Education & Awareness",
    services: [
      {
        id: "resources",
        title: "Educational Resources",
        description: "Learn about hemophilia care",
        icon: { set: "ion", name: "book-outline" },
      },
      {
        id: "training",
        title: "Training & Workshops",
        description: "Join learning sessions",
        icon: { set: "ion", name: "school-outline" },
      },
      {
        id: "campaigns",
        title: "Campaigns",
        description: "Awareness drives & events",
        icon: { set: "ion", name: "megaphone-outline" },
      },
      {
        id: "tools",
        title: "Hemophilia Tools",
        description: "Helpful calculators & guides",
        icon: { set: "ion", name: "bulb-outline" },
      },
    ],
  },
  {
    id: "support",
    title: "Support & Community",
    services: [
      {
        id: "community",
        title: "Community Support",
        description: "Connect with other patients",
        icon: { set: "ion", name: "people-outline" },
      },
      {
        id: "programs",
        title: "Support Programs",
        description: "NHS assistance programs",
        icon: { set: "ion", name: "heart-outline" },
      },
      {
        id: "help",
        title: "Help & Support",
        description: "Get answers to your questions",
        icon: { set: "ion", name: "chatbubbles-outline" },
      },
      {
        id: "contact",
        title: "Contact Us",
        description: "Reach the NHS team",
        icon: { set: "ion", name: "call-outline" },
      },
    ],
  },
  {
    id: "more",
    title: "More Services",
    services: [
      {
        id: "downloads",
        title: "Useful Downloads",
        description: "Forms, guides & resources",
        icon: { set: "ion", name: "download-outline" },
      },
      {
        id: "centers",
        title: "Find Treatment Center",
        description: "Locate nearby hospitals",
        icon: { set: "ion", name: "business-outline" },
      },
      {
        id: "emergency-id",
        title: "Emergency ID",
        description: "Your digital emergency card",
        icon: { set: "ion", name: "id-card-outline" },
      },
      {
        id: "settings",
        title: "Settings & Preferences",
        description: "Manage your app settings",
        icon: { set: "ion", name: "settings-outline" },
      },
    ],
  },
];
