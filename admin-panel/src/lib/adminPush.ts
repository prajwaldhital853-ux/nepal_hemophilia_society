import { apiFetch } from "@/lib/api";
import { showBrowserNotification } from "@/lib/browserNotifications";

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

const SW_PATH = "/firebase-messaging-sw.js";

export type AdminPushResult = { ok: true } | { ok: false; error: string };

function firebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };
}

function firebaseConfigured() {
  const config = firebaseConfig();
  return Boolean(config.apiKey && config.projectId && config.appId && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
}

function pushErrorMessage(err: unknown) {
  const code = typeof err === "object" && err && "code" in err ? String((err as { code?: string }).code || "") : "";
  const message = err instanceof Error ? err.message : String(err || "Unknown error");
  if (code.includes("invalid-vapid-key")) {
    return "Invalid VAPID key. In Firebase Console → Project settings → Cloud Messaging → Web configuration, copy the key pair into NEXT_PUBLIC_FIREBASE_VAPID_KEY on Vercel, then redeploy.";
  }
  if (code.includes("failed-service-worker-registration")) {
    return "Service worker registration failed. Hard-refresh the page (Ctrl+Shift+R) and try again.";
  }
  if (message.toLowerCase().includes("api key not valid") || message.toLowerCase().includes("api_key")) {
    return "Firebase API key is blocked for this website. In Google Cloud Console → Credentials, allow HTTP referrers for https://nepal-hemophilia-society.vercel.app/*";
  }
  return message || "Push registration failed.";
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

async function serviceWorkerRegistration() {
  let registration = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (!registration) {
    registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: "/",
      updateViaCache: "none",
    });
  }
  await navigator.serviceWorker.ready;
  return registration;
}

export function isAdminPushConfigured() {
  return firebaseConfigured();
}

export async function registerAdminWebPush(): Promise<AdminPushResult> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { ok: false, error: "This browser does not support service workers." };
  }
  if (!firebaseConfigured()) {
    return {
      ok: false,
      error: "Firebase web push is not configured. Add NEXT_PUBLIC_FIREBASE_* keys on Vercel and redeploy.",
    };
  }

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission was not granted." };
  }

  try {
    const registration = await serviceWorkerRegistration();
    const firebase = await loadFirebaseCompat();
    const config = firebaseConfig();
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
        storageBucket: config.storageBucket || `${config.projectId}.firebasestorage.app`,
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
    if (!token) {
      return { ok: false, error: "Firebase did not return a push token. Check the Web Push key pair in Firebase Console." };
    }

    await apiFetch("/notifications/push-token/", {
      method: "POST",
      body: JSON.stringify({ token, platform: "web", app: "admin" }),
    });
    localStorage.setItem("nhms-admin-push-ready", "1");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: pushErrorMessage(err) };
  }
}
