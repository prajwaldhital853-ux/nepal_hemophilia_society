"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

import { en } from "@/lib/i18n/messages/en";
import { ne } from "@/lib/i18n/messages/ne";
import type { Locale } from "@/lib/i18n/types";
import { buildPhraseLookup, flattenMessages, getByPath, localizeText } from "@/lib/i18n/utils";

const STORAGE_KEY = "nhs-locale";

const enFlat = flattenMessages(en);
const neFlat = flattenMessages(ne);
const phraseLookup = buildPhraseLookup(enFlat, neFlat);

function readLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(STORAGE_KEY) === "ne" ? "ne" : "en";
}

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale === "ne" ? "ne" : "en";
}

type LocaleCtx = {
  locale: Locale;
  ready: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
  l: (text: string) => string;
};

const LocaleContext = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const next = readLocale();
    setLocaleState(next);
    applyLocale(next);
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    applyLocale(locale);
  }, [locale, ready]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyLocale(next);
  }

  const value = useMemo<LocaleCtx>(
    () => ({
      locale,
      ready,
      setLocale,
      toggleLocale: () => setLocale(locale === "en" ? "ne" : "en"),
      t: (key: string) => {
        const tree = locale === "ne" ? ne : en;
        const hit = getByPath(tree, key);
        if (hit) return hit;
        const fallback = getByPath(en, key);
        return fallback ?? key;
      },
      l: (text: string) => localizeText(text, locale, phraseLookup),
    }),
    [locale, ready],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}

/** Translate any English UI label — works for nav text, statuses, API enums, table headers. */
export function useLocalizedLabel() {
  const { l } = useLocale();
  return l;
}
