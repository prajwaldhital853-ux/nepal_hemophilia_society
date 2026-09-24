export function GET() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.firebasestorage.app` : ""),
  };
  const body = `
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");
firebase.initializeApp(${JSON.stringify(config)});
const messaging = firebase.messaging();

function hrefFor(category, relatedType) {
  const topic = relatedType || category || "";
  if (topic === "appointment") return "/dashboard/appointments";
  if (["injection", "schedule", "treatment", "bleeding", "bleeding_episode"].includes(topic)) return "/dashboard/injections";
  if (topic === "stock") return "/dashboard/stock";
  if (["patient", "profile", "document"].includes(topic)) return "/dashboard/patients";
  if (topic === "admin") return "/dashboard/admins";
  if (["website", "system"].includes(topic)) return "/dashboard/website";
  if (topic === "backup") return "/dashboard/settings";
  return "/dashboard";
}

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification && payload.notification.title ? payload.notification.title : (payload.data && payload.data.title) || "NHMS";
  const bodyText = payload.notification && payload.notification.body ? payload.notification.body : (payload.data && payload.data.body) || "";
  const category = payload.data && payload.data.category ? payload.data.category : "";
  const relatedType = payload.data && payload.data.relatedType ? payload.data.relatedType : category;
  const href = hrefFor(category, relatedType);
  self.registration.showNotification(title, {
    body: bodyText,
    icon: "/notification-icon.png",
    badge: "/notification-icon.png",
    tag: payload.data && payload.data.id ? "nhms-" + payload.data.id : undefined,
    data: { href },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data && event.notification.data.href ? event.notification.data.href : "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(href);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(href);
    })
  );
});
`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
