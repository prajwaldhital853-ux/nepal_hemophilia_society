"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { registerAdminWebPush } from "@/lib/adminPush";
import {
  canUseBrowserNotifications,
  notificationPermission,
  requestBrowserNotificationPermission,
} from "@/lib/browserNotifications";
import { useAuth } from "@/lib/auth";
import { hrefForNotification } from "@/components/layout/notificationHref";
import { UnreadBadge } from "@/components/ui/UnreadBadge";

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
  const [browserAlerts, setBrowserAlerts] = useState<NotificationPermission | "unsupported">("default");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = (await apiFetch("/notifications/admin/")) as { notifications?: AdminNote[]; unreadCount?: number };
      const rows = Array.isArray(data.notifications) ? data.notifications : [];
      const visible = rows.filter((row) => !row.isRead);
      setItems(visible);
      setUnread(Number(data.unreadCount ?? visible.length));
    } catch {
      setItems([]);
      setUnread(0);
    }
  }, [user]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 10000);
    const onRefresh = () => void load();
    window.addEventListener("nhms-notifications-refresh", onRefresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("nhms-notifications-refresh", onRefresh);
    };
  }, [load]);

  useEffect(() => {
    setBrowserAlerts(notificationPermission());
  }, [user]);

  async function enableBrowserAlerts() {
    const permission = await requestBrowserNotificationPermission();
    setBrowserAlerts(permission);
    if (permission === "granted") {
      await registerAdminWebPush().catch(() => undefined);
    }
  }

  async function markAll() {
    await apiFetch("/notifications/admin/read-all/", { method: "POST" });
    setUnread(0);
    setItems((rows) => rows.map((row) => ({ ...row, isRead: true })));
  }

  async function markOne(note: AdminNote) {
    await apiFetch(`/notifications/admin/${note.id}/read/`, { method: "POST" });
    setItems((rows) => rows.filter((row) => row.id !== note.id));
    setUnread((count) => Math.max(0, count - 1));
  }

  async function openOne(note: AdminNote) {
    await apiFetch(`/notifications/admin/${note.id}/read/`, { method: "POST" });
    setItems((rows) => rows.filter((row) => row.id !== note.id));
    setUnread((count) => Math.max(0, count - 1));
    setOpen(false);
    router.push(hrefForNotification(note));
  }

  return (
    <div className="relative overflow-visible">
      <button
        type="button"
        className="panel relative overflow-visible p-1.5 text-muted shadow-none hover:bg-elevated hover:text-ink"
        aria-label="Notifications"
        onClick={() => {
          setOpen((value) => !value);
          void load();
        }}
      >
        <Bell className="size-4" />
        <UnreadBadge count={unread} />
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[340px] max-w-[80vw] rounded-xl border border-black/10 bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-black/5 px-3 py-2">
            <p className="text-[13px] font-semibold text-ink">Notifications</p>
            <button type="button" className="text-[11px] font-semibold text-red-700" onClick={() => void markAll()}>
              Mark all read
            </button>
          </div>
          {canUseBrowserNotifications() && browserAlerts !== "granted" ? (
            <div className="border-b border-black/5 px-3 py-2">
              <button
                type="button"
                className="w-full rounded bg-brand px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
                onClick={() => void enableBrowserAlerts()}
              >
                Turn on browser alerts
              </button>
            </div>
          ) : null}
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12px] text-muted">No notifications yet.</p>
            ) : (
              items.map((note) => (
                <div key={note.id} className="flex items-start gap-1 border-b border-black/5 bg-red-50/60">
                  <button
                    type="button"
                    className="min-w-0 flex-1 px-3 py-2 text-left hover:bg-elevated"
                    onClick={() => void openOne(note)}
                  >
                    <p className="text-[12px] font-semibold text-ink">{note.title}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted">{note.message}</p>
                    <p className="mt-1 text-[10px] text-faint">{formatWhen(note.createdAt)}</p>
                  </button>
                  <button
                    type="button"
                    className="mr-2 mt-2 rounded-full p-1 text-red-700 hover:bg-red-100"
                    aria-label="Mark as read"
                    title="Mark as read"
                    onClick={() => void markOne(note)}
                  >
                    <Check className="size-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

