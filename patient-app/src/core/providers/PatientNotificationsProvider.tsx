import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import { invalidatePatientData } from "@/core/patientDataEvents";
import { playPatientAlertSound } from "@/features/notifications/alertSound";
import { isExpoGo } from "@/features/notifications/expoGo";

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
  const seenIdsRef = useRef<Set<number>>(new Set());
  const bootstrappedRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      seenIdsRef.current = new Set();
      bootstrappedRef.current = false;
      return;
    }
    if (!silent) setLoading(true);
    try {
      const data = await patientApi("/notifications/?limit=100", { token });
      const rows = Array.isArray(data.notifications) ? data.notifications : [];
      const previous = seenIdsRef.current;
      const fresh = bootstrappedRef.current
        ? rows.filter((row) => !previous.has(row.id) && !row.isRead)
        : [];
      if (fresh.length > 0) {
        const topics = fresh.flatMap((row) => [row.category, row.relatedType || ""]).filter(Boolean);
        void playPatientAlertSound();
        const clinical = new Set(["injection", "schedule", "treatment", "bleeding", "bleeding_episode"]);
        const clinicalTopics = topics.filter((topic) => clinical.has(topic));
        if (clinicalTopics.length) invalidatePatientData(clinicalTopics);
      }
      seenIdsRef.current = new Set(rows.map((row) => row.id));
      bootstrappedRef.current = true;
      setNotifications(rows);
      setUnreadCount(Number(data.unreadCount ?? 0));
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && !isExpoGo()) {
      void import("@/features/notifications/registerPush")
        .then((mod) => mod.registerPatientPush(token))
        .catch(() => undefined);
    }
    void load().catch(() => undefined);
    if (!token) return;
    const timer = setInterval(() => {
      void load(true).catch(() => undefined);
    }, 10000);
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
