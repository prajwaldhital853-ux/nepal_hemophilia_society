import type { RootStackParamList } from "@/core/navigation/types";
import type { PatientNotification } from "@/core/providers/PatientNotificationsProvider";

export function destinationForNotification(
  item: Pick<PatientNotification, "category" | "relatedType" | "relatedId">,
): { screen: keyof RootStackParamList; params?: RootStackParamList[keyof RootStackParamList] } | null {
  const topic = item.relatedType || item.category;
  if (topic === "injection" || topic === "schedule") return { screen: "Injections" };
  if (topic === "treatment") return { screen: "Treatments" };
  if (topic === "bleeding" || topic === "bleeding_episode") return { screen: "Bleeding" };
  if (topic === "stock") return { screen: "Factor" };
  if (topic === "document") return { screen: "Documents" };
  if (topic === "profile" || topic === "patient") return { screen: "EmergencyId" };
  if (topic === "insight" || topic === "insights") return { screen: "Insights" };
  if (topic === "appointment") return { screen: "Appointments", params: item.relatedId ? { appointmentId: item.relatedId } : undefined };
  return null;
}

export const TOPICS_BY_SCREEN: Partial<Record<keyof RootStackParamList, string[]>> = {
  Injections: ["injection", "schedule"],
  Treatments: ["treatment"],
  Bleeding: ["bleeding", "bleeding_episode"],
  Factor: ["stock"],
  Documents: ["document"],
  EmergencyId: ["profile", "patient"],
  Insights: ["insight", "insights"],
  Appointments: ["appointment"],
};
