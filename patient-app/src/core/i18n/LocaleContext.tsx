import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";

import { en } from "@/core/i18n/messages/en";
import { ne } from "@/core/i18n/messages/ne";
import type { Locale } from "@/core/i18n/types";
import { buildPhraseLookup, flattenMessages, getByPath, localizeText } from "@/core/i18n/utils";

const STORAGE_KEY = "nhms-patient-locale";
const enFlat = flattenMessages(en);
const neFlat = flattenMessages(ne);
const phraseLookup = buildPhraseLookup(enFlat, neFlat);

type LocaleCtx = {
  locale: Locale;
  ready: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
  l: (text: string) => string;
};

const LocaleContext = createContext<LocaleCtx | null>(null);

async function readLocale(): Promise<Locale> {
  try {
    const stored = await SecureStore.getItemAsync(STORAGE_KEY);
    return stored === "ne" ? "ne" : "en";
  } catch {
    return "en";
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void readLocale().then((next) => {
      setLocaleState(next);
      setReady(true);
    });
  }, []);

  async function setLocale(next: Locale) {
    setLocaleState(next);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }

  const value = useMemo<LocaleCtx>(
    () => ({
      locale,
      ready,
      setLocale,
      toggleLocale: () => void setLocale(locale === "en" ? "ne" : "en"),
      t: (key: string) => {
        const tree = locale === "ne" ? ne : en;
        return getByPath(tree, key) ?? getByPath(en, key) ?? key;
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
