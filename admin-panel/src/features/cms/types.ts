export type ServiceCategoryId = "treatment" | "education" | "support" | "more";
export type ServiceActionType = "content" | "app_screen" | "url" | "news" | "events" | "resources" | "gallery";
export type ContentKind = "news" | "event" | "resource" | "gallery";

export type AppService = {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  category: ServiceCategoryId;
  categoryLabel: string;
  iconSet: "ion" | "mci";
  iconName: string;
  actionType: ServiceActionType;
  actionLabel: string;
  actionValue: string;
  phone: string;
  email: string;
  websiteUrl: string;
  address: string;
  published: boolean;
  sortOrder: number;
};

export type CmsArticle = {
  id: number;
  kind: ContentKind;
  kindLabel: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  imageUrl: string;
  fileUrl: string;
  location: string;
  startsAt?: string | null;
  endsAt?: string | null;
  published: boolean;
  sortOrder: number;
};

export const SERVICE_CATEGORIES: { id: ServiceCategoryId; label: string }[] = [
  { id: "treatment", label: "Treatment & Health Management" },
  { id: "education", label: "Education & Awareness" },
  { id: "support", label: "Support & Community" },
  { id: "more", label: "More Services" },
];

export const SERVICE_ACTIONS: { id: ServiceActionType; label: string }[] = [
  { id: "content", label: "Detail page (copy in admin)" },
  { id: "app_screen", label: "Open app screen" },
  { id: "url", label: "External link" },
  { id: "news", label: "News list" },
  { id: "events", label: "Events list" },
  { id: "resources", label: "Resources / downloads" },
  { id: "gallery", label: "Gallery" },
];

export const APP_SCREENS = [
  "Treatments",
  "Injections",
  "Documents",
  "Bleeding",
  "Factor",
  "Centers",
  "EmergencyId",
  "Settings",
];
