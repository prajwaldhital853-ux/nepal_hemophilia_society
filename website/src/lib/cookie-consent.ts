import { deleteCookie, getCookie, setCookie } from "@/lib/cookies";

export const CONSENT_COOKIE = "nhs_cookie_consent";
export const ANALYTICS_COOKIE = "nhs_analytics_id";
export const PREFERENCES_COOKIE = "nhs_site_prefs";

export type CookieConsentState = {
  version: 1;
  necessary: true;
  analytics: boolean;
  preferences: boolean;
  updatedAt: string;
};

export type CookieDraft = Pick<CookieConsentState, "analytics" | "preferences">;

const CONSENT_EVENT = "nhs:cookie-consent";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `nhs-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function parseConsent(raw: string | null): CookieConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (parsed.version !== 1 || parsed.necessary !== true) return null;
    return {
      version: 1,
      necessary: true,
      analytics: Boolean(parsed.analytics),
      preferences: Boolean(parsed.preferences),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function readConsent(): CookieConsentState | null {
  return parseConsent(getCookie(CONSENT_COOKIE));
}

export function saveConsent(draft: CookieDraft): CookieConsentState {
  const consent: CookieConsentState = {
    version: 1,
    necessary: true,
    analytics: draft.analytics,
    preferences: draft.preferences,
    updatedAt: new Date().toISOString(),
  };
  setCookie(CONSENT_COOKIE, JSON.stringify(consent));
  applyConsent(consent);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
  }
  return consent;
}

export function acceptAllCookies() {
  return saveConsent({ analytics: true, preferences: true });
}

export function rejectOptionalCookies() {
  return saveConsent({ analytics: false, preferences: false });
}

export function applyConsent(consent: CookieConsentState) {
  if (consent.analytics) {
    if (!getCookie(ANALYTICS_COOKIE)) {
      setCookie(ANALYTICS_COOKIE, randomId());
    }
  } else {
    deleteCookie(ANALYTICS_COOKIE);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("nhs_analytics_queue");
    }
  }

  if (consent.preferences) {
    if (!getCookie(PREFERENCES_COOKIE)) {
      setCookie(PREFERENCES_COOKIE, JSON.stringify({ savedAt: new Date().toISOString() }));
    }
  } else {
    deleteCookie(PREFERENCES_COOKIE);
  }
}

export function hasAnalyticsConsent(consent: CookieConsentState | null = readConsent()) {
  return Boolean(consent?.analytics);
}

export function trackPageView(path: string) {
  const consent = readConsent();
  if (!consent?.analytics) return;

  const entry = {
    path,
    at: new Date().toISOString(),
    session: getCookie(ANALYTICS_COOKIE),
  };

  if (typeof sessionStorage === "undefined") return;
  try {
    const queue = JSON.parse(sessionStorage.getItem("nhs_analytics_queue") ?? "[]") as typeof entry[];
    queue.push(entry);
    sessionStorage.setItem("nhs_analytics_queue", JSON.stringify(queue.slice(-50)));
  } catch {
    sessionStorage.setItem("nhs_analytics_queue", JSON.stringify([entry]));
  }
}

export function subscribeConsent(listener: (consent: CookieConsentState) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    listener((event as CustomEvent<CookieConsentState>).detail);
  };
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
