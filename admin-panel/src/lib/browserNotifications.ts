import { hrefForNotification } from "@/components/layout/notificationHref";

export type AlertNote = {
  id: number;
  category: string;
  title: string;
  message: string;
  relatedType?: string;
};

export function canUseBrowserNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!canUseBrowserNotifications()) return "unsupported";
  return Notification.permission;
}

export async function requestBrowserNotificationPermission() {
  if (!canUseBrowserNotifications()) return "denied" as NotificationPermission;
  return Notification.requestPermission();
}

export function showBrowserNotification(note: AlertNote) {
  if (!canUseBrowserNotifications() || Notification.permission !== "granted") return;

  const href = hrefForNotification(note);
  const tag = `nhms-admin-${note.id}`;

  try {
    const notification = new Notification(note.title, {
      body: note.message,
      icon: "/notification-icon.png",
      badge: "/notification-icon.png",
      tag,
      data: { href, id: note.id },
    });
    notification.onclick = () => {
      window.focus();
      if (href) window.location.assign(href);
      notification.close();
    };
  } catch {
    // Some browsers block notifications outside a user gesture.
  }
}
