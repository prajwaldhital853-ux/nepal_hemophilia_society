type InvalidateListener = (topics: string[]) => void;

const listeners = new Set<InvalidateListener>();

export function onPatientDataInvalidate(listener: InvalidateListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function invalidatePatientData(topics: string[] = ["all"]) {
  listeners.forEach((listener) => listener(topics));
}
