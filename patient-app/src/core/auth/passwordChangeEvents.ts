type Listener = () => void;

const listeners = new Set<Listener>();

export function onMustChangePassword(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyMustChangePassword() {
  listeners.forEach((listener) => listener());
}
