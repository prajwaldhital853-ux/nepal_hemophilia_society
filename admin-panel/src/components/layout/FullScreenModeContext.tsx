"use client";

import { Maximize2, Menu, Minimize2 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useLocale } from "@/lib/i18n";

type FullScreenModeContextValue = {
  immersive: boolean;
  nativeFullscreen: boolean;
  enterImmersive: () => Promise<void>;
  exitImmersive: () => Promise<void>;
  toggleImmersive: () => Promise<void>;
};

const FullScreenModeContext = createContext<FullScreenModeContextValue | null>(null);

export function FullScreenModeProvider({ children }: { children: ReactNode }) {
  const [immersive, setImmersive] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const active = Boolean(document.fullscreenElement);
      setNativeFullscreen(active);
      if (!active) {
        setImmersive(false);
      }
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const enterImmersive = useCallback(async () => {
    setImmersive(true);
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Safari / embedded browsers may block native fullscreen; chromeless layout still applies.
    }
  }, []);

  const exitImmersive = useCallback(async () => {
    setImmersive(false);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleImmersive = useCallback(async () => {
    if (immersive || document.fullscreenElement) {
      await exitImmersive();
    } else {
      await enterImmersive();
    }
  }, [enterImmersive, exitImmersive, immersive]);

  const value = useMemo(
    () => ({
      immersive,
      nativeFullscreen,
      enterImmersive,
      exitImmersive,
      toggleImmersive,
    }),
    [immersive, nativeFullscreen, enterImmersive, exitImmersive, toggleImmersive],
  );

  return <FullScreenModeContext.Provider value={value}>{children}</FullScreenModeContext.Provider>;
}

export function useFullScreenMode() {
  const ctx = useContext(FullScreenModeContext);
  if (!ctx) {
    throw new Error("useFullScreenMode must be used within FullScreenModeProvider");
  }
  return ctx;
}

export function FullScreenToggleButton({ className = "" }: { className?: string }) {
  const { immersive, toggleImmersive } = useFullScreenMode();
  const { t } = useLocale();

  return (
    <button
      type="button"
      onClick={() => void toggleImmersive()}
      className={`panel p-1.5 text-muted shadow-none hover:bg-elevated hover:text-ink ${className}`}
      aria-label={immersive ? t("common.exitFullscreen") : t("common.enterFullscreen")}
      title={immersive ? t("common.exitFullscreen") : t("common.enterFullscreen")}
    >
      {immersive ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
    </button>
  );
}

export function FullScreenExitFloating() {
  const { immersive, exitImmersive } = useFullScreenMode();
  const { toggleNav } = useMobileNav();
  const { t } = useLocale();

  if (!immersive) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex items-center justify-between px-3">
      <button
        type="button"
        onClick={toggleNav}
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-line bg-card/95 p-2 text-ink shadow-lg backdrop-blur-sm hover:bg-elevated lg:hidden"
        aria-label={t("common.openMenu")}
        title={t("common.openMenu")}
      >
        <Menu className="size-4" />
      </button>
      <span className="hidden lg:block" />
      <button
        type="button"
        onClick={() => void exitImmersive()}
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-line bg-card/95 px-3 py-1.5 text-[11px] font-semibold text-ink shadow-lg backdrop-blur-sm hover:bg-elevated"
        aria-label={t("common.exitFullscreen")}
      >
        <Minimize2 className="size-3.5" />
        {t("common.exitFullscreen")}
      </button>
    </div>
  );
}
