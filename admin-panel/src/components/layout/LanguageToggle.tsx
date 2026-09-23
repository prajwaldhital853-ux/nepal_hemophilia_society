"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useLocale, type Locale } from "@/lib/i18n";

const options: { id: Locale; label: string; flag: string }[] = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "ne", label: "नेपाली", flag: "🇳🇵" },
];

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = options.find((o) => o.id === locale) ?? options[0];

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-ink hover:bg-elevated"
        aria-label={t("lang.toggle")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm leading-none">{active.flag}</span>
        {locale === "ne" ? "ने" : "EN"}
        <ChevronDown className="size-3 text-faint" />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[9rem] overflow-hidden panel shadow-lg">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-elevated ${
                locale === option.id ? "bg-brand-soft font-semibold text-brand" : "text-ink"
              }`}
              onClick={() => {
                setLocale(option.id);
                setOpen(false);
              }}
            >
              <span>{option.flag}</span>
              <span>{option.id === "ne" ? option.label : t(`lang.${option.id}`)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
