import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { ApiError, AUTH_TIMEOUT_MS, patientApi } from "@/core/api";
import { AuthContext, type AuthState } from "@/core/auth/context";
import { clearSession, getDeviceId, loadSession, saveSession } from "@/core/auth/storage";
import type { PatientRecord } from "@/core/auth/types";

export type { PatientRecord } from "@/core/auth/types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [patient, setPatient] = useState<PatientRecord | null>(null);

  const refreshPatient = useCallback(async (access = token) => {
    if (!access) {
      setPatient(null);
      return;
    }
    const data = await patientApi("/me/patient/", { token: access, timeoutMs: AUTH_TIMEOUT_MS });
    setPatient(data.patient);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await loadSession();
      if (cancelled) return;
      if (!session.access) {
        setReady(true);
        return;
      }
      setToken(session.access);
      try {
        const data = await patientApi("/me/patient/", { token: session.access, timeoutMs: AUTH_TIMEOUT_MS });
        if (!cancelled) {
          setPatient(data.patient);
          setMustChangePassword(false);
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 403) {
          setMustChangePassword(true);
        } else if (error instanceof ApiError && error.status === 401) {
          await clearSession();
          setToken("");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const deviceId = await getDeviceId();
    const data = await patientApi("/auth/patient/login/", {
      method: "POST",
      timeoutMs: AUTH_TIMEOUT_MS,
      body: JSON.stringify({
        identifier: identifier.trim(),
        password: password.trim(),
        deviceId,
      }),
    });
    await saveSession(data.access, data.refresh);
    setToken(data.access);
    setMustChangePassword(Boolean(data.mustChangePassword));
    if (!data.mustChangePassword) {
      await refreshPatient(data.access);
    } else {
      setPatient(null);
    }
  }, [refreshPatient]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const data = await patientApi("/auth/patient/change-password/", {
        method: "POST",
        token,
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword: newPassword }),
      });
      await saveSession(data.access, data.refresh);
      setToken(data.access);
      setMustChangePassword(false);
      await refreshPatient(data.access);
    },
    [refreshPatient, token],
  );

  const logout = useCallback(async () => {
    await clearSession();
    setToken("");
    setPatient(null);
    setMustChangePassword(false);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      token,
      mustChangePassword,
      patient,
      login,
      changePassword,
      logout,
      refreshPatient: () => refreshPatient(),
    }),
    [ready, token, mustChangePassword, patient, login, changePassword, logout, refreshPatient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
