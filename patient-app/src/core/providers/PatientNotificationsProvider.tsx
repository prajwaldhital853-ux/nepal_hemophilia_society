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
import { registerPatientPush } from "@/features/notifications/registerPush";

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
  markRead: (id: number) => Promise<void>;
  markTopicsSeen: (topics: string[]) => Promise<void>;
};

function matchesTopic(item: PatientNotification, topics: string[]) {
  return topics.includes(item.category) || topics.includes(item.relatedType || "");
}

const PatientNotificationsContext = createContext<NotificationsValue | null>(null);

export function PatientNotificationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<PatientNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
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
    if (token) void registerPatientPush(token).catch(() => undefined);
    void load().catch(() => undefined);
    if (!token) return;
    const timer = setInterval(() => {
      void load(true).catch(() => undefined);
    }, 30000);
    return () => clearInterval(timer);
  }, [load, token]);

  const markRead = useCallback(
    async (id: number) => {
      setNotifications((rows) => rows.map((row) => (row.id === id ? { ...row, isRead: true } : row)));
      setUnreadCount((count) => Math.max(0, count - 1));
      if (!token) return;
      try {
        await patientApi(`/notifications/${id}/read/`, { method: "POST", token });
      } catch {
        void load(true);
      }
    },
    [load, token],
  );

  const markTopicsSeen = useCallback(
    async (topics: string[]) => {
      if (!topics.length) return;
      setNotifications((rows) => {
        const next = rows.map((row) => (matchesTopic(row, topics) ? { ...row, isRead: true } : row));
        setUnreadCount(next.filter((row) => !row.isRead).length);
        return next;
      });
      if (!token) return;
      try {
        await patientApi("/notifications/seen/", { method: "POST", token, body: JSON.stringify({ topics }) });
      } catch {
        void load(true);
      }
    },
    [load, token],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh: load,
      markRead,
      markTopicsSeen,
    }),
    [notifications, unreadCount, loading, load, markRead, markTopicsSeen],
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
    markRead: ctx.markRead,
    markTopicsSeen: ctx.markTopicsSeen,
  };
}
