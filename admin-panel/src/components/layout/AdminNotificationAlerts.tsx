"use client";

import { useCallback, useEffect, useRef } from "react";

import { apiFetch } from "@/lib/api";
import { registerAdminWebPush } from "@/lib/adminPush";
import { showBrowserNotification, type AlertNote } from "@/lib/browserNotifications";
import { useAuth } from "@/lib/auth";

type AdminNote = AlertNote & { isRead?: boolean };

function unreadRows(rows: AdminNote[]) {
  return rows.filter((row) => !row.isRead);
}

/**
 * Polls admin notifications and shows native browser alerts for every new unread item.
 * Works without Firebase; FCM is registered when env keys are present.
 */
export function AdminNotificationAlerts() {
  const { user } = useAuth();
  const seenIds = useRef<Set<number>>(new Set());
  const bootstrapped = useRef(false);
  const pushRegistered = useRef(false);

  const poll = useCallback(async () => {
    if (!user || typeof window === "undefined") return;
    if (Notification.permission !== "granted") return;

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
        bootstrapped.current = true;
        return;
      }

      let hasNew = false;
      for (const note of combined) {
        if (seenIds.current.has(note.id)) continue;
        seenIds.current.add(note.id);
        showBrowserNotification(note);
        hasNew = true;
      }
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

    void poll();
    const timer = window.setInterval(() => void poll(), 10000);
    return () => window.clearInterval(timer);
  }, [poll, user]);

  useEffect(() => {
    if (!user || pushRegistered.current) return;
    if (Notification.permission !== "granted") return;
    pushRegistered.current = true;
    void registerAdminWebPush().catch(() => {
      pushRegistered.current = false;
    });
  }, [user]);

  return null;
}
