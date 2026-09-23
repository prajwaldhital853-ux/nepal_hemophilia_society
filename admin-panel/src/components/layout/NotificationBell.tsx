"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { hrefForNotification } from "@/components/layout/notificationHref";

type AdminNote = {
  id: number;
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  actorName?: string;
  createdAt: string;
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNote[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = (await apiFetch("/notifications/admin/")) as { notifications?: AdminNote[]; unreadCount?: number };
      const rows = Array.isArray(data.notifications) ? data.notifications : [];
      const visible = rows.filter((row) => !row.isRead && row.category !== "appointment");
      setItems(visible);
      setUnread(visible.length);
    } catch {
      setItems([]);
      setUnread(0);
    }
  }, [user]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 25000);
    const onRefresh = () => void load();
    window.addEventListener("nhms-notifications-refresh", onRefresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("nhms-notifications-refresh", onRefresh);
    };
  }, [load]);

  useEffect(() => {
    if (user) void registerAdminPush().catch(() => undefined);
  }, [user]);

  async function markAll() {
    await apiFetch("/notifications/admin/read-all/", { method: "POST" });
    setUnread(0);
    setItems((rows) => rows.map((row) => ({ ...row, isRead: true })));
  }

  async function openOne(note: AdminNote) {
    await apiFetch(`/notifications/admin/${note.id}/read/`, { method: "POST" });
    setItems((rows) => rows.filter((row) => row.id !== note.id));
    setUnread((count) => Math.max(0, count - 1));
    setOpen(false);
    router.push(hrefForNotification(note));
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="panel relative p-1.5 text-muted shadow-none hover:bg-elevated hover:text-ink"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[340px] max-w-[80vw] rounded-xl border border-black/10 bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-black/5 px-3 py-2">
            <p className="text-[13px] font-semibold text-ink">Notifications</p>
            <button type="button" className="text-[11px] font-semibold text-red-700" onClick={() => void markAll()}>
              Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12px] text-muted">No notifications yet.</p>
            ) : (
              items.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className={`block w-full border-b border-black/5 px-3 py-2 text-left hover:bg-elevated ${note.isRead ? "" : "bg-red-50/60"}`}
                  onClick={() => void openOne(note)}
                >
                  <p className="text-[12px] font-semibold text-ink">{note.title}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted">{note.message}</p>
                  <p className="mt-1 text-[10px] text-faint">{formatWhen(note.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

async function registerAdminPush() {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return;
  const vapid = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!vapid || !apiKey || !projectId) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const firebase = await loadFirebaseCompat();
  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }
  const messaging = firebase.messaging();
  const token = await messaging.getToken({ vapidKey: vapid, serviceWorkerRegistration: registration });
  if (!token) return;
  await apiFetch("/notifications/push-token/", {
    method: "POST",
    body: JSON.stringify({ token, platform: "web", app: "admin" }),
  });
}

function loadFirebaseCompat(): Promise<{
  apps: unknown[];
  initializeApp: (config: Record<string, string | undefined>) => void;
  messaging: () => { getToken: (options: { vapidKey: string; serviceWorkerRegistration: ServiceWorkerRegistration }) => Promise<string> };
}> {
  return new Promise((resolve, reject) => {
    const win = window as Window & { firebase?: ReturnType<typeof loadFirebaseCompat> extends Promise<infer T> ? T : never };
    if (win.firebase) {
      resolve(win.firebase);
      return;
    }
    const appScript = document.createElement("script");
    appScript.src = "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js";
    appScript.onload = () => {
      const msgScript = document.createElement("script");
      msgScript.src = "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js";
      msgScript.onload = () => resolve(win.firebase as NonNullable<typeof win.firebase>);
      msgScript.onerror = () => reject(new Error("Firebase messaging failed to load"));
      document.head.appendChild(msgScript);
    };
    appScript.onerror = () => reject(new Error("Firebase app failed to load"));
    document.head.appendChild(appScript);
  });
}
