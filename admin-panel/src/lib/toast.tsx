"use client";

import { showToast } from "@/lib/toastBus";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return children;
}

export function useToast() {
  return { show: showToast };
}
