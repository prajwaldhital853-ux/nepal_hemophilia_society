"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export type HeaderPanelId = "notifications" | "messages";

const CLOSE_EVENT = "nhms-close-header-panels";

export function useHeaderPanel(panelId: HeaderPanelId, open: boolean, setOpen: (open: boolean) => void) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function onClose(event: Event) {
      const except = (event as CustomEvent<{ except?: HeaderPanelId }>).detail?.except;
      if (except !== panelId) setOpen(false);
    }
    window.addEventListener(CLOSE_EVENT, onClose);
    return () => window.removeEventListener(CLOSE_EVENT, onClose);
  }, [panelId, setOpen]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, setOpen]);

  function toggle() {
    if (!open) {
      window.dispatchEvent(new CustomEvent(CLOSE_EVENT, { detail: { except: panelId } }));
    }
    setOpen(!open);
  }

  return { rootRef, toggle };
}
