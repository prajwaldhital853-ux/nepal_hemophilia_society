const TOAST_HOST_ID = "nhs-toast-host";
const TOAST_DURATION_MS = 5000;

const pending: string[] = [];

function getHost(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let host = document.getElementById(TOAST_HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = TOAST_HOST_ID;
    document.body.appendChild(host);
  }
  host.setAttribute("aria-live", "polite");
  return host;
}

function dismissToast(el: HTMLElement, timer: number) {
  window.clearTimeout(timer);
  el.remove();
}

function renderToast(host: HTMLElement, message: string) {
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.className = "nhs-toast";

  const text = document.createElement("span");
  text.className = "nhs-toast__message";
  text.textContent = message;

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Dismiss notification");
  button.className = "nhs-toast__dismiss";
  button.textContent = "×";

  const timer = window.setTimeout(() => dismissToast(el, timer), TOAST_DURATION_MS);
  button.addEventListener("click", () => dismissToast(el, timer));

  el.append(text, button);
  host.appendChild(el);
}

function flushPending() {
  const host = getHost();
  if (!host) return;
  while (pending.length) {
    renderToast(host, pending.shift()!);
  }
}

export function showToast(message: string) {
  const text = message.trim();
  if (!text) return;

  if (typeof document === "undefined") {
    pending.push(text);
    return;
  }

  const host = getHost();
  if (!host) {
    pending.push(text);
    return;
  }

  renderToast(host, text);
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", flushPending);
  if (document.readyState !== "loading") {
    flushPending();
  }
}
