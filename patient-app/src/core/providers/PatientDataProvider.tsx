import type { ReactNode } from "react";

import { useAuth } from "@/core/auth/AuthContext";
import { PatientClinicalStatsProvider } from "@/core/providers/PatientClinicalStatsProvider";
import { PatientNotificationsProvider } from "@/core/providers/PatientNotificationsProvider";

export function PatientDataProvider({ children }: { children: ReactNode }) {
  const { token, mustChangePassword } = useAuth();
  const enabled = Boolean(token) && !mustChangePassword;

  if (!enabled) return children;

  return (
    <PatientClinicalStatsProvider>
      <PatientNotificationsProvider>{children}</PatientNotificationsProvider>
    </PatientClinicalStatsProvider>
  );
}
