import { patientApi } from "@/core/api";
import type { AppService, CmsArticle, ServiceCategoryGroup } from "@/features/services/types";

export async function fetchPatientServices(token: string, search = "") {
  const q = new URLSearchParams();
  if (search.trim()) q.set("search", search.trim());
  const data = await patientApi(`/cms/services/${q.toString() ? `?${q}` : ""}`, { token });
  return (data.categories ?? []) as ServiceCategoryGroup[];
}

export async function fetchPatientService(token: string, slug: string) {
  const data = await patientApi(`/cms/services/${slug}/`, { token });
  return data.service as AppService;
}

export async function fetchCmsArticles(token: string, kind: string, cursor?: string) {
  const q = new URLSearchParams({ limit: "25" });
  if (cursor) q.set("cursor", cursor);
  const data = await patientApi(`/cms/content/${kind}/?${q.toString()}`, { token });
  return {
    articles: (data.articles ?? []) as CmsArticle[],
    nextCursor: (data.nextCursor ?? null) as string | null,
  };
}

export async function fetchCmsArticle(token: string, kind: string, slug: string) {
  const data = await patientApi(`/cms/content/${kind}/${slug}/`, { token });
  return data.article as CmsArticle;
}

export async function fetchTreatmentCenters(token: string, search = "") {
  const q = new URLSearchParams();
  if (search.trim()) q.set("search", search.trim());
  const data = await patientApi(`/cms/centers/${q.toString() ? `?${q}` : ""}`, { token });
  return (data.centers ?? []) as { id: number; name: string; province: string; district: string }[];
}
