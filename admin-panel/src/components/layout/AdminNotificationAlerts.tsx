"use client";

import { useCallback, useEffect, useRef } from "react";

import { apiFetch } from "@/lib/api";
import { isAdminPushConfigured, registerAdminWebPush } from "@/lib/adminPush";
import { showBrowserNotification, type AlertNote } from "@/lib/browserNotifications";
import { useAuth } from "@/lib/auth";

type AdminNote = AlertNote & { isRead?: boolean };

const SEEN_KEY = "nhms-admin-alert-ids";

function loadSeenIds() {
  if (typeof window === "undefined") return new Set<number>();
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as number[]) : [];
    return new Set(parsed.filter((id) => Number.isFinite(id)));
  } catch {
    return new Set<number>();
  }
}

function saveSeenIds(ids: Set<number>) {
  sessionStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(ids).slice(-500)));
}

function unreadRows(rows: AdminNote[]) {
  return rows.filter((row) => !row.isRead);
}

/**
 * Keeps badges fresh. Browser pop-ups use Firebase when configured (works with tab closed).
 * Polling pop-ups are only used when Firebase web push is not configured.
 */
export function AdminNotificationAlerts() {
  const { user } = useAuth();
  const seenIds = useRef<Set<number>>(loadSeenIds());
  const bootstrapped = useRef(false);
  const pushRegistered = useRef(false);
  const pushReady = useRef(isAdminPushConfigured());

  const poll = useCallback(async () => {
    if (!user || typeof window === "undefined") return;

    try {
      const data = (await apiFetch("/notifications/admin/")) as {
        notifications?: AdminNote[];
        appointmentNotifications?: AdminNote[];
      };
      const general = unreadRows(Array.isArray(data.notifications) ? data.notifications : []);
      const appointments = unreadRows(
        Array.isArray(data.appointmentNotifications) ? data.appointmentNotifications : [],
      );
      const combined = [...general, ...appointments];

      if (!bootstrapped.current) {
        combined.forEach((row) => seenIds.current.add(row.id));
        saveSeenIds(seenIds.current);
        bootstrapped.current = true;
        window.dispatchEvent(new Event("nhms-notifications-refresh"));
        return;
      }

      const usePollingPopups = Notification.permission === "granted" && !pushReady.current;
      let hasNew = false;
      for (const note of combined) {
        if (seenIds.current.has(note.id)) continue;
        seenIds.current.add(note.id);
        if (usePollingPopups) {
          showBrowserNotification(note);
        }
        hasNew = true;
      }
      saveSeenIds(seenIds.current);
      if (hasNew) {
        window.dispatchEvent(new Event("nhms-notifications-refresh"));
      }
    } catch {
      // Ignore polling errors — bell still works.
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      seenIds.current = new Set();
      bootstrapped.current = false;
      pushRegistered.current = false;
      return;
    }

    seenIds.current = loadSeenIds();
    void poll();
    const timer = window.setInterval(() => void poll(), 10000);
    const onRefresh = () => void poll();
    window.addEventListener("nhms-notifications-refresh", onRefresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("nhms-notifications-refresh", onRefresh);
    };
  }, [poll, user]);

  useEffect(() => {
    if (!user || pushRegistered.current) return;
    if (Notification.permission !== "granted") return;
    pushRegistered.current = true;
    void registerAdminWebPush()
      .then((result) => {
        pushReady.current = result.ok;
        if (!result.ok) pushRegistered.current = false;
      })
      .catch(() => {
        pushRegistered.current = false;
        pushReady.current = false;
      });
  }, [user]);

  return null;
}
