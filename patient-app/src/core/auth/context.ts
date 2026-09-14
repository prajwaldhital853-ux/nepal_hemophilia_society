import { createContext } from "react";

import type { PatientRecord } from "@/core/auth/types";

export type AuthState = {
  ready: boolean;
  token: string;
  mustChangePassword: boolean;
  patient: PatientRecord | null;
  login: (identifier: string, password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshPatient: (force?: boolean) => Promise<void>;
};

export const AuthContext = createContext<AuthState | null>(null);
