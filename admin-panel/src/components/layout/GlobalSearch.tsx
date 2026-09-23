"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";

import { runGlobalSearch, type GlobalSearchHit } from "@/lib/globalSearch";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";

const KIND_LABEL: Record<GlobalSearchHit["kind"], string> = {
  patient: "Patient",
  admin: "Admin",
  stock: "Stock",
  hospital: "Hospital",
};

export function GlobalSearch() {
  const { can } = useAuth();
  const { t, l } = useLocale();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<GlobalSearchHit[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open || debounced.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void runGlobalSearch(debounced, can)
      .then((rows) => {
        if (!cancelled) setHits(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open, can]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative hidden min-w-0 flex-1 sm:block">
      <label className="panel-inset flex h-7 max-w-lg items-center gap-2 px-2 shadow-none">
        <Search className="size-3.5 shrink-0 text-faint" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full min-w-0 bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
          placeholder={t("common.searchPatients")}
          aria-label="Global search"
          aria-expanded={open}
          aria-controls="global-search-results"
        />
      </label>

      {open && debounced.length >= 2 ? (
        <div
          id="global-search-results"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-80 overflow-auto panel shadow-lg"
        >
          {loading ? (
            <p className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-muted">
              <Loader2 className="size-3.5 animate-spin" />
              {t("common.loading")}
            </p>
          ) : hits.length === 0 ? (
            <p className="px-3 py-2.5 text-[11px] text-muted">No matches for “{debounced}”.</p>
          ) : (
            <ul>
              {hits.map((hit) => (
                <li key={`${hit.kind}-${hit.id}`}>
                  <Link
                    href={hit.href}
                    className="block px-3 py-2 hover:bg-elevated"
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <p className="text-[11px] font-semibold text-ink">{l(hit.label)}</p>
                    <p className="text-[10px] text-muted">
                      {l(KIND_LABEL[hit.kind])}
                      {hit.meta ? ` · ${hit.meta}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
