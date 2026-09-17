import { apiFetch } from "@/lib/api";
import type { AppService, CmsArticle, ContentKind, ServiceCategoryId } from "./types";

export async function fetchAdminServices(params?: {
  search?: string;
  category?: string;
  published?: string;
  cursor?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.category && params.category !== "All") q.set("category", params.category);
  if (params?.published === "true" || params?.published === "false") q.set("published", params.published);
  if (params?.cursor) q.set("cursor", params.cursor);
  q.set("limit", "50");
  return apiFetch(`/cms/admin/services/?${q.toString()}`) as Promise<{
    services: AppService[];
    nextCursor: string | null;
    categories: { id: ServiceCategoryId; label: string }[];
  }>;
}

export async function saveAdminService(payload: Partial<AppService> & { title: string }, id?: number) {
  if (id) {
    return apiFetch(`/cms/admin/services/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }) as Promise<{ service: AppService }>;
  }
  return apiFetch("/cms/admin/services/", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ service: AppService }>;
}

export async function deleteAdminService(id: number) {
  return apiFetch(`/cms/admin/services/${id}/`, { method: "DELETE" });
}

export async function fetchAdminArticles(params?: { kind?: ContentKind; search?: string; cursor?: string }) {
  const q = new URLSearchParams();
  if (params?.kind) q.set("kind", params.kind);
  if (params?.search) q.set("search", params.search);
  if (params?.cursor) q.set("cursor", params.cursor);
  q.set("limit", "25");
  return apiFetch(`/cms/admin/content/?${q.toString()}`) as Promise<{
    articles: CmsArticle[];
    nextCursor: string | null;
  }>;
}

export async function saveAdminArticle(payload: Partial<CmsArticle> & { title: string; kind: ContentKind }, id?: number) {
  if (id) {
    return apiFetch(`/cms/admin/content/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }) as Promise<{ article: CmsArticle }>;
  }
  return apiFetch("/cms/admin/content/", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ article: CmsArticle }>;
}

export async function deleteAdminArticle(id: number) {
  return apiFetch(`/cms/admin/content/${id}/`, { method: "DELETE" });
}
