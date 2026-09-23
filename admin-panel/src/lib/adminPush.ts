import { apiFetch } from "@/lib/api";
import { showBrowserNotification, type AlertNote } from "@/lib/browserNotifications";

type FirebaseCompat = {
  apps: unknown[];
  initializeApp: (config: Record<string, string | undefined>) => void;
  messaging: () => {
    getToken: (options: { vapidKey: string; serviceWorkerRegistration: ServiceWorkerRegistration }) => Promise<string>;
    onMessage: (handler: (payload: FirebasePayload) => void) => void;
  };
};

type FirebasePayload = {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
};

function firebaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}

function loadFirebaseCompat(): Promise<FirebaseCompat> {
  return new Promise((resolve, reject) => {
    const win = window as Window & { firebase?: FirebaseCompat };
    if (win.firebase) {
      resolve(win.firebase);
      return;
    }
    const appScript = document.createElement("script");
    appScript.src = "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js";
    appScript.onload = () => {
      const msgScript = document.createElement("script");
      msgScript.src = "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js";
      msgScript.onload = () => resolve(win.firebase as FirebaseCompat);
      msgScript.onerror = () => reject(new Error("Firebase messaging failed to load"));
      document.head.appendChild(msgScript);
    };
    appScript.onerror = () => reject(new Error("Firebase app failed to load"));
    document.head.appendChild(appScript);
  });
}

export async function registerAdminWebPush() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !firebaseConfigured()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const firebase = await loadFirebaseCompat();
  if (!firebase.apps.length) {
    firebase.initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  }

  const messaging = firebase.messaging();
  messaging.onMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || "NHMS";
    const body = payload.notification?.body || payload.data?.body || "";
    const category = payload.data?.category || "";
    const relatedType = payload.data?.relatedType || category;
    showBrowserNotification({
      id: Number(payload.data?.id || Date.now()),
      category,
      relatedType,
      title,
      message: body,
    });
    window.dispatchEvent(new Event("nhms-notifications-refresh"));
  });

  const token = await messaging.getToken({
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
    serviceWorkerRegistration: registration,
  });
  if (!token) return false;

  await apiFetch("/notifications/push-token/", {
    method: "POST",
    body: JSON.stringify({ token, platform: "web", app: "admin" }),
  });
  return true;
}
