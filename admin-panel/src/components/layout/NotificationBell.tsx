"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";

import { refreshAdminNotifications, useAdminNotificationFeed, type AdminNote } from "@/components/layout/adminNotificationFeed";
import { apiFetch } from "@/lib/api";
import { registerAdminWebPush } from "@/lib/adminPush";
import {
  canUseBrowserNotifications,
  notificationPermission,
  requestBrowserNotificationPermission,
} from "@/lib/browserNotifications";
import { useAuth } from "@/lib/auth";
import { hrefForNotification } from "@/components/layout/notificationHref";
import { useHeaderPanel } from "@/components/layout/useHeaderPanel";
import { UnreadBadge } from "@/components/ui/UnreadBadge";
import { SHORTCUT_EVENT } from "@/lib/keyboardShortcuts";

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { rootRef, toggle } = useHeaderPanel("notifications", open, setOpen);
  const feed = useAdminNotificationFeed(user?.id);
  const [items, setItems] = useState<AdminNote[]>([]);
  const [unread, setUnread] = useState(0);
  const [browserAlerts, setBrowserAlerts] = useState<NotificationPermission | "unsupported">("default");

  const load = useCallback(async () => {
    if (!user) return;
    await refreshAdminNotifications();
  }, [user]);

  useEffect(() => {
    const visible = feed.notifications.filter((row) => !row.isRead);
    setItems(visible);
    setUnread(feed.unreadCount);
  }, [feed]);

  useEffect(() => {
    setBrowserAlerts(notificationPermission());
  }, [user]);

  useEffect(() => {
    function onShortcut(event: Event) {
      const action = (event as CustomEvent<{ action: string }>).detail?.action;
      if (action === "toggle-notifications") {
        setOpen((value) => !value);
        void load();
      }
    }
    window.addEventListener(SHORTCUT_EVENT, onShortcut);
    return () => window.removeEventListener(SHORTCUT_EVENT, onShortcut);
  }, [load]);

  async function enableBrowserAlerts() {
    const permission = await requestBrowserNotificationPermission();
    setBrowserAlerts(permission);
    if (permission === "granted") {
      const result = await registerAdminWebPush();
      if (!result.ok) {
        window.alert(`Browser alerts are on, but push registration failed.\n\n${result.error}`);
      }
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
    <div ref={rootRef} className="relative overflow-visible">
      <span className="relative inline-flex align-middle">
        <button
          type="button"
          className="panel p-1.5 text-muted shadow-none hover:bg-elevated hover:text-ink"
          aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
          aria-expanded={open}
          onClick={() => {
            toggle();
            void load();
          }}
        >
          <Bell className="size-4" />
        </button>
        <UnreadBadge count={unread} />
      </span>
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
