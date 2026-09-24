const TOAST_HOST_ID = "nhs-toast-host";

export type ConfirmOptions = {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

let activeDismiss: ((confirmed: boolean) => void) | null = null;
let activeElement: HTMLElement | null = null;

function getHost(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(TOAST_HOST_ID);
}

function dismiss(confirmed: boolean) {
  if (activeElement) {
    activeElement.remove();
    activeElement = null;
  }
  const resolve = activeDismiss;
  activeDismiss = null;
  resolve?.(confirmed);
}

export function showConfirm({
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}: ConfirmOptions): Promise<boolean> {
  const text = message.trim();
  if (!text) return Promise.resolve(false);

  if (activeDismiss) {
    dismiss(false);
  }

  const host = getHost();
  if (!host) return Promise.resolve(false);

  return new Promise((resolve) => {
    activeDismiss = resolve;

    const el = document.createElement("div");
    el.setAttribute("role", "alertdialog");
    el.setAttribute("aria-modal", "true");
    el.className = "nhs-confirm";

    const messageEl = document.createElement("p");
    messageEl.className = "nhs-confirm__message";
    messageEl.textContent = text;

    const actions = document.createElement("div");
    actions.className = "nhs-confirm__actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "nhs-confirm__cancel";
    cancelButton.textContent = cancelLabel;

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.className = "nhs-confirm__confirm";
    confirmButton.textContent = confirmLabel;

    cancelButton.addEventListener("click", () => dismiss(false));
    confirmButton.addEventListener("click", () => dismiss(true));

    actions.append(cancelButton, confirmButton);
    el.append(messageEl, actions);
    host.prepend(el);
    activeElement = el;
    confirmButton.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss(false);
      }
    }

    document.addEventListener("keydown", onKeyDown, { once: true });
  });
}
