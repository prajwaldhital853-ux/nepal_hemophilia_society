"use client";

import { useEffect } from "react";

import { SHORTCUT_EVENT } from "@/lib/keyboardShortcuts";

export function useShortcutAction(action: string, handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onShortcut = (event: Event) => {
      const detail = (event as CustomEvent<{ action: string }>).detail;
      if (detail?.action === action) handler();
    };
    window.addEventListener(SHORTCUT_EVENT, onShortcut);
    return () => window.removeEventListener(SHORTCUT_EVENT, onShortcut);
  }, [action, handler, enabled]);
}
