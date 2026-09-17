export type ServiceIcon = {
  set: "ion" | "mci";
  name: string;
};

export type AppService = {
  id: number | string;
  slug: string;
  title: string;
  description: string;
  body?: string;
  category: string;
  categoryLabel?: string;
  iconSet: "ion" | "mci";
  iconName: string;
  actionType: "content" | "app_screen" | "url" | "news" | "events" | "resources" | "gallery" | string;
  actionValue?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  address?: string;
  published?: boolean;
};

export type ServiceCategoryGroup = {
  id: string;
  title: string;
  services: AppService[];
};

export type CmsArticle = {
  id: number;
  kind: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  imageUrl?: string;
  fileUrl?: string;
  location?: string;
  startsAt?: string | null;
  endsAt?: string | null;
};

export function toCardItem(service: AppService) {
  return {
    id: service.slug,
    title: service.title,
    description: service.description,
    icon: { set: service.iconSet, name: service.iconName } as ServiceIcon,
  };
}
