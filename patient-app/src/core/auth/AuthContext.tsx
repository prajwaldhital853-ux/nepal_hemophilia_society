import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { InteractionManager } from "react-native";

import { ApiError, AUTH_TIMEOUT_MS, patientApi } from "@/core/api";
import { AuthContext, type AuthState } from "@/core/auth/context";
import { onMustChangePassword } from "@/core/auth/passwordChangeEvents";
import {
  clearSession,
  getPatientDeviceAuth,
  getRememberMePreference,
  loadSession,
  saveSession,
} from "@/core/auth/storage";
import type { PatientRecord } from "@/core/auth/types";

export type { PatientRecord } from "@/core/auth/types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [patient, setPatient] = useState<PatientRecord | null>(null);

  const lastPatientFetch = useRef(0);

  const refreshPatient = useCallback(async (access = token, force = false) => {
    if (!access) {
      setPatient(null);
      return;
    }
    const now = Date.now();
    if (!force && now - lastPatientFetch.current < 15000) return;
    lastPatientFetch.current = now;
    try {
      const data = await patientApi("/me/patient/", { token: access, timeoutMs: AUTH_TIMEOUT_MS });
      setPatient(data.patient);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) return;
      throw error;
    }
  }, [token]);

  useEffect(() => onMustChangePassword(() => {
    setMustChangePassword(true);
    setPatient(null);
  }), []);

  useEffect(() => {
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      void (async () => {
      try {
        const session = await loadSession();
        if (cancelled) return;
        if (!session.access) return;

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
            const stored = await loadSession();
            if (stored.refresh) {
              try {
                const refreshed = await patientApi("/auth/refresh/", {
                  method: "POST",
                  body: JSON.stringify({ refresh: stored.refresh }),
                  timeoutMs: AUTH_TIMEOUT_MS,
                });
                if (refreshed?.access) {
                  const remember = await getRememberMePreference();
                  await saveSession(refreshed.access, refreshed.refresh ?? stored.refresh, remember);
                  setToken(refreshed.access);
                  const retry = await patientApi("/me/patient/", {
                    token: refreshed.access,
                    timeoutMs: AUTH_TIMEOUT_MS,
                  });
                  if (!cancelled) setPatient(retry.patient);
                  return;
                }
              } catch {
                // fall through to clear session
              }
            }
            await clearSession();
            setToken("");
          }
        }
      } catch {
        // Never crash on cold start — show login if bootstrap fails.
      } finally {
        if (!cancelled) setReady(true);
      }
      })();
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string, rememberMe = true) => {
    const { deviceId, deviceSignals } = await getPatientDeviceAuth();
    const data = await patientApi("/auth/patient/login/", {
      method: "POST",
      timeoutMs: AUTH_TIMEOUT_MS,
      body: JSON.stringify({
        identifier: identifier.trim(),
        password: password.trim(),
        deviceId,
        deviceSignals,
      }),
    });
    if (!data?.access || !data?.refresh) {
      throw new ApiError("Invalid login response from server.", 0);
    }
    await saveSession(data.access, data.refresh, rememberMe);
    setToken(data.access);
    setMustChangePassword(Boolean(data.mustChangePassword || data.passwordExpired));
    if (!data.mustChangePassword && !data.passwordExpired) {
      void refreshPatient(data.access, true);
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
      if (!data?.access || !data?.refresh) {
        throw new ApiError("Invalid password change response from server.", 0);
      }
      const remember = await getRememberMePreference();
      await saveSession(data.access, data.refresh, remember);
      setToken(data.access);
      setMustChangePassword(false);
      void refreshPatient(data.access, true);
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
