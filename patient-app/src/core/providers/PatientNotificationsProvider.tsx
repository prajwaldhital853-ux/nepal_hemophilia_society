import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";

export type PatientNotification = {
  id: number;
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedType?: string;
  relatedId?: number | null;
  createdAt: string;
};

type NotificationsValue = {
  notifications: PatientNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
};

const PatientNotificationsContext = createContext<NotificationsValue | null>(null);

export function PatientNotificationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await patientApi("/notifications/", { token });
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(Number(data.unreadCount ?? 0));
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh: load,
    }),
    [notifications, unreadCount, loading, load],
  );

  return <PatientNotificationsContext.Provider value={value}>{children}</PatientNotificationsContext.Provider>;
}

export function usePatientNotifications(category = "all") {
  const ctx = useContext(PatientNotificationsContext);
  if (!ctx) {
    throw new Error("usePatientNotifications must be used within PatientNotificationsProvider");
  }

  const filtered = useMemo(() => {
    if (!category || category === "all") return ctx.notifications;
    return ctx.notifications.filter((item) => item.category === category);
  }, [ctx.notifications, category]);

  return {
    notifications: filtered,
    unreadCount: ctx.unreadCount,
    loading: ctx.loading,
    refresh: ctx.refresh,
  };
}
