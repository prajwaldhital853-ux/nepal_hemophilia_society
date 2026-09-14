import { useCallback, type ReactNode } from "react";

import { useAuth } from "@/core/auth/AuthContext";
import { usePatientClinicalStats } from "@/core/providers/PatientClinicalStatsProvider";
import { usePatientNotifications } from "@/core/providers/PatientNotificationsProvider";
import { usePatientEventStream } from "@/core/realtime/usePatientEventStream";

export function PatientRealtimeBridge({ children }: { children: ReactNode }) {
  const { token, refreshPatient } = useAuth();
  const { refresh: refreshClinical } = usePatientClinicalStats();
  const { refresh: refreshNotifications } = usePatientNotifications();

  const onStreamEvent = useCallback(
    (_event: string, data: Record<string, unknown>) => {
      const kind = String(data.type ?? _event);
      void refreshPatient(true).catch(() => undefined);
      if (kind === "profile" || kind === "injections" || kind === "bleeding" || kind === "notification") {
        void refreshClinical().catch(() => undefined);
      }
      if (kind !== "connected") {
        void refreshNotifications().catch(() => undefined);
      }
    },
    [refreshPatient, refreshClinical, refreshNotifications],
  );

  usePatientEventStream(token, Boolean(token), onStreamEvent);

  return children;
}
