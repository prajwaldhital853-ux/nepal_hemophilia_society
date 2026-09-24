"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

export type AdminNote = {
  id: number;
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  actorName?: string;
  createdAt: string;
  relatedType?: string;
};

export type AdminNotificationFeed = {
  notifications: AdminNote[];
  appointmentNotifications: AdminNote[];
  unreadCount: number;
  appointmentUnreadCount: number;
  /** True after a successful fetch, including an empty inbox. */
  loaded: boolean;
};

const EMPTY: AdminNotificationFeed = {
  notifications: [],
  appointmentNotifications: [],
  unreadCount: 0,
  appointmentUnreadCount: 0,
  loaded: false,
};

const POLL_MS = 10_000;

type Listener = (feed: AdminNotificationFeed) => void;

const listeners = new Set<Listener>();
let feed: AdminNotificationFeed | null = null;
let ownerId = "";
let inflight: Promise<void> | null = null;
let queued = false;
let timer: number | null = null;
let listening = false;

function emit(next: AdminNotificationFeed) {
  feed = next;
  listeners.forEach((listener) => listener(next));
}

/** One in-flight request shared by the bell, appointment inbox, and alert poller. */
export function refreshAdminNotifications() {
  if (typeof window === "undefined") return Promise.resolve();
  if (inflight) {
    queued = true;
    return inflight;
  }
  inflight = (async () => {
    try {
      const data = (await apiFetch("/notifications/admin/")) as Partial<AdminNotificationFeed>;
      emit({
        notifications: Array.isArray(data.notifications) ? data.notifications : [],
        appointmentNotifications: Array.isArray(data.appointmentNotifications) ? data.appointmentNotifications : [],
        unreadCount: Number(data.unreadCount ?? 0),
        appointmentUnreadCount: Number(data.appointmentUnreadCount ?? 0),
        loaded: true,
      });
    } catch {
      emit(EMPTY);
    } finally {
      inflight = null;
      if (queued) {
        queued = false;
        void refreshAdminNotifications();
      }
    }
  })();
  return inflight;
}

function onExternalRefresh() {
  void refreshAdminNotifications();
}

function ensureStarted() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("nhms-notifications-refresh", onExternalRefresh);
  void refreshAdminNotifications();
  timer = window.setInterval(() => void refreshAdminNotifications(), POLL_MS);
}

function maybeStop() {
  if (listeners.size > 0 || typeof window === "undefined") return;
  listening = false;
  if (timer != null) window.clearInterval(timer);
  timer = null;
  window.removeEventListener("nhms-notifications-refresh", onExternalRefresh);
  feed = null;
  ownerId = "";
  queued = false;
}

export function subscribeAdminNotifications(listener: Listener, nextOwnerId: string) {
  const ownerChanged = ownerId !== nextOwnerId;
  if (ownerChanged) {
    ownerId = nextOwnerId;
    feed = null;
  }
  listeners.add(listener);
  const wasListening = listening;
  ensureStarted();
  if (ownerChanged && wasListening) void refreshAdminNotifications();
  else if (feed) listener(feed);
  return () => {
    listeners.delete(listener);
    maybeStop();
  };
}

export function useAdminNotificationFeed(userId: number | string | null | undefined) {
  const [value, setValue] = useState<AdminNotificationFeed>(EMPTY);
  useEffect(() => {
    if (userId == null || userId === "") {
      setValue(EMPTY);
      return;
    }
    return subscribeAdminNotifications(setValue, String(userId));
  }, [userId]);
  return value;
}
