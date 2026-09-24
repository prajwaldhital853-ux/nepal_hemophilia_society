"use client";

import { useEffect, useRef } from "react";

import { useAdminNotificationFeed, type AdminNote } from "@/components/layout/adminNotificationFeed";
import { registerAdminWebPush } from "@/lib/adminPush";
import { loadAdminAlertSeenIds, saveAdminAlertSeenIds, shouldShowAdminAlertPopup } from "@/lib/adminNotificationSeen";
import { showBrowserNotification } from "@/lib/browserNotifications";
import { playNotificationSound } from "@/lib/notificationSound";
import { useAuth } from "@/lib/auth";

function unreadRows(rows: AdminNote[]) {
  return rows.filter((row) => !row.isRead);
}

/**
 * Browser pop-ups use Firebase when configured (works with the tab closed).
 * Polling pop-ups are only used when Firebase web push is not configured.
 * The feed itself is loaded once and shared with the bell and appointment inbox.
 */
export function AdminNotificationAlerts() {
  const { user } = useAuth();
  const feed = useAdminNotificationFeed(user?.id);
  const seenIds = useRef<Set<number>>(loadAdminAlertSeenIds());
  const bootstrapped = useRef(false);
  const pushRegistered = useRef(false);
  const pushReady = useRef(false);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      seenIds.current = new Set();
      bootstrapped.current = false;
      pushRegistered.current = false;
      return;
    }
    if (!feed.loaded) return;

    const combined = [
      ...unreadRows(feed.notifications),
      ...unreadRows(feed.appointmentNotifications),
    ];

    if (!bootstrapped.current) {
      seenIds.current = loadAdminAlertSeenIds();
      combined.forEach((row) => seenIds.current.add(row.id));
      saveAdminAlertSeenIds(seenIds.current);
      bootstrapped.current = true;
      return;
    }

    const usePollingPopups = Notification.permission === "granted" && !pushReady.current;
    let hasNew = false;
    for (const note of combined) {
      if (seenIds.current.has(note.id)) continue;
      seenIds.current.add(note.id);
      if (usePollingPopups && shouldShowAdminAlertPopup(note.id)) {
        showBrowserNotification(note);
      }
      hasNew = true;
    }
    saveAdminAlertSeenIds(seenIds.current);
    if (hasNew) playNotificationSound();
  }, [feed, user]);

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
