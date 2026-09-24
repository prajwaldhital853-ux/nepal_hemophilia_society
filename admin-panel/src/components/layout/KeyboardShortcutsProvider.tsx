"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard } from "lucide-react";

import { KeyboardShortcutsDialog } from "@/components/layout/KeyboardShortcutsDialog";
import { useMobileNav } from "@/components/layout/MobileNavContext";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import {
  GO_NAV,
  activateShortcutTarget,
  dispatchShortcut,
  isTypingTarget,
  resolveShortcutAction,
} from "@/lib/keyboardShortcuts";
import { showConfirm } from "@/lib/confirmBus";
import { useTheme } from "@/lib/theme";

type KeyboardShortcutsContextValue = {
  openHelp: () => void;
  closeHelp: () => void;
  helpOpen: boolean;
};

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

const CLOSE_HEADER_PANELS = "nhms-close-header-panels";

function closeHeaderPanels() {
  window.dispatchEvent(new CustomEvent(CLOSE_HEADER_PANELS, { detail: { except: "" } }));
}

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { canOpen, logout } = useAuth();
  const { toggle } = useTheme();
  const { locale, setLocale } = useLocale();
  const { toggleNav, closeNav, open: mobileNavOpen } = useMobileNav();
  const [helpOpen, setHelpOpen] = useState(false);
  const goPending = useRef(false);
  const goTimer = useRef<number | null>(null);

  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  const clearGoPending = useCallback(() => {
    goPending.current = false;
    if (goTimer.current != null) {
      window.clearTimeout(goTimer.current);
      goTimer.current = null;
    }
  }, []);

  const startGoSequence = useCallback(() => {
    goPending.current = true;
    if (goTimer.current != null) window.clearTimeout(goTimer.current);
    goTimer.current = window.setTimeout(() => {
      goPending.current = false;
      goTimer.current = null;
    }, 1500);
  }, []);

  const navigateGo = useCallback(
    (key: string) => {
      const target = GO_NAV[key];
      clearGoPending();
      if (!target) return;
      if (!canOpen(target.href)) return;
      closeHeaderPanels();
      setHelpOpen(false);
      router.push(target.href);
    },
    [canOpen, clearGoPending, router],
  );

  const runAction = useCallback(
    (action: string) => {
      switch (action) {
        case "help":
          setHelpOpen(true);
          return;
        case "close":
          if (helpOpen) {
            setHelpOpen(false);
            return;
          }
          closeHeaderPanels();
          if (mobileNavOpen) closeNav();
          (document.activeElement as HTMLElement | null)?.blur?.();
          return;
        case "global-search":
          activateShortcutTarget("global-search");
          return;
        case "notifications":
          dispatchShortcut("toggle-notifications");
          return;
        case "messages":
          dispatchShortcut("toggle-messages");
          return;
        case "theme":
          toggle();
          return;
        case "language":
          setLocale(locale === "ne" ? "en" : "ne");
          return;
        case "profile":
          router.push("/dashboard/profile");
          return;
        case "sidebar":
          toggleNav();
          return;
        case "logout":
          void showConfirm({
            message: "Sign out of the admin panel?",
            confirmLabel: "Sign out",
          }).then((confirmed) => {
            if (confirmed) logout();
          });
          return;
        case "page-search":
          activateShortcutTarget("page-search");
          return;
        case "page-new":
          activateShortcutTarget("page-new");
          return;
        case "page-export":
          activateShortcutTarget("page-export");
          return;
        case "page-save":
          activateShortcutTarget("page-save");
          return;
        case "page-refresh":
          dispatchShortcut("page-refresh");
          return;
        case "patients-new":
          if (canOpen("/dashboard/patients/new")) router.push("/dashboard/patients/new");
          return;
        case "injections-log":
          if (!activateShortcutTarget("injections-log") && canOpen("/dashboard/injections")) {
            router.push("/dashboard/injections?openLog=1");
          }
          return;
        case "appointments-slots":
          if (!activateShortcutTarget("appointments-slots") && canOpen("/dashboard/appointments")) {
            router.push("/dashboard/appointments?openSlots=1");
          }
          return;
        case "stock-in":
          if (!activateShortcutTarget("stock-in") && canOpen("/dashboard/stock")) {
            router.push("/dashboard/stock?openStockIn=1");
          }
          return;
        default:
          return;
      }
    },
    [canOpen, closeNav, helpOpen, locale, logout, mobileNavOpen, router, setLocale, toggle, toggleNav],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (goPending.current && !event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1) {
        const key = event.key.toLowerCase();
        if (GO_NAV[key]) {
          event.preventDefault();
          navigateGo(key);
          return;
        }
      }

      if (event.key.toLowerCase() === "g" && !event.ctrlKey && !event.metaKey && !event.altKey && !isTypingTarget(event.target)) {
        event.preventDefault();
        startGoSequence();
        return;
      }

      const action = resolveShortcutAction(event);
      if (!action) return;

      if (action !== "close" && isTypingTarget(event.target)) return;

      event.preventDefault();
      runAction(action);
    }

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [navigateGo, runAction, startGoSequence]);

  const value = useMemo(
    () => ({
      openHelp,
      closeHelp,
      helpOpen,
    }),
    [closeHelp, helpOpen, openHelp],
  );

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
      <KeyboardShortcutsDialog open={helpOpen} onClose={closeHelp} />
    </KeyboardShortcutsContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const ctx = useContext(KeyboardShortcutsContext);
  if (!ctx) throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsProvider");
  return ctx;
}

export function KeyboardShortcutsButton() {
  const { openHelp } = useKeyboardShortcuts();

  return (
    <button
      type="button"
      className="panel p-1.5 text-muted shadow-none hover:bg-elevated hover:text-ink"
      aria-label="Keyboard shortcuts"
      title="Keyboard shortcuts (?)"
      onClick={openHelp}
    >
      <Keyboard className="size-4" />
    </button>
  );
}
