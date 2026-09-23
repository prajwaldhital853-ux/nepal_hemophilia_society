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
  host.className =
    "pointer-events-none fixed bottom-4 right-4 z-[99999] flex w-[min(92vw,28rem)] flex-col gap-2";
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
  el.className =
    "pointer-events-auto flex items-center justify-between gap-3 rounded-xl px-5 py-3.5 text-[13px] font-medium text-white shadow-lg";
  el.style.backgroundColor = "#2f6fed";

  const text = document.createElement("span");
  text.className = "min-w-0 flex-1 leading-snug";
  text.textContent = message;

  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Dismiss notification");
  button.className = "shrink-0 rounded px-1 text-base leading-none text-white/90 hover:bg-white/15";
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
