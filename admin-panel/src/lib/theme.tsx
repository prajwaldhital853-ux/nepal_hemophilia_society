"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "nhs-theme";

function readTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

function applyTheme(next: Theme) {
  document.documentElement.classList.toggle("dark", next === "dark");
  document.documentElement.style.colorScheme = next;
}

const ThemeCtx = createContext<{
  theme: Theme;
  ready: boolean;
  toggle: () => void;
  setTheme: (t: Theme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const next = readTheme();
    setThemeState(next);
    applyTheme(next);
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    applyTheme(theme);
  }, [theme, ready]);

  function setTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  const value = useMemo(
    () => ({
      theme,
      ready,
      setTheme,
      toggle: () => {
        setThemeState((current) => {
          const next = current === "dark" ? "light" : "dark";
          localStorage.setItem(STORAGE_KEY, next);
          applyTheme(next);
          return next;
        });
      },
    }),
    [theme, ready],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
