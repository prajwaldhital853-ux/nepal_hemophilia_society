"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { showToast, subscribeToast } from "@/lib/toastBus";

type ToastItem = {
  id: number;
  message: string;
};

type ToastContextValue = {
  show: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  const push = useCallback((message: string) => {
    const text = message.trim();
    if (!text) return;
    const id = nextId++;
    setItems((current) => [...current, { id, message: text }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 5000);
  }, []);

  const show = useCallback((message: string) => {
    showToast(message);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    setMounted(true);
    return subscribeToast(push);
  }, [push]);

  const value = useMemo(() => ({ show }), [show]);

  const toastLayer = mounted
    ? createPortal(
          <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex w-[min(92vw,28rem)] flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl px-5 py-3.5 text-[13px] font-medium text-white shadow-lg"
                style={{ backgroundColor: "#2f6fed" }}
                role="status"
              >
                <span className="min-w-0 flex-1 leading-snug">{item.message}</span>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-white/90 hover:bg-white/15"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(item.id)}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )
    : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toastLayer}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
