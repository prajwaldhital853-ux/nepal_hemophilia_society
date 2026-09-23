"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { PAGE_NOTIFICATION_TOPICS } from "@/components/layout/notificationHref";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function topicsForPath(pathname: string) {
  for (const [prefix, topics] of PAGE_NOTIFICATION_TOPICS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return topics;
    }
  }
  return [];
}

/** Mark in-app admin notifications read when the matching dashboard page is opened. */
export function NotificationPageSync() {
  const pathname = usePathname();
  const { user } = useAuth();
  const lastMarked = useRef("");

  useEffect(() => {
    if (!user) return;
    const topics = topicsForPath(pathname);
    if (!topics.length) return;
    const key = `${pathname}:${topics.join(",")}`;
    if (lastMarked.current === key) return;
    lastMarked.current = key;

    void apiFetch("/notifications/admin/seen/", {
      method: "POST",
      body: JSON.stringify({ topics }),
    })
      .then(() => {
        window.dispatchEvent(new Event("nhms-notifications-refresh"));
      })
      .catch(() => undefined);
  }, [pathname, user]);

  return null;
}
