"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export type ActionsMenuItem = {
  label: string;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
  hidden?: boolean;
};

type ActionsMenuProps = {
  items: ActionsMenuItem[];
  ariaLabel: string;
  buttonClassName?: string;
  iconClassName?: string;
  align?: "left" | "right";
};

export async function copyText(value: string) {
  if (!value || typeof navigator === "undefined") return;
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    /* ignore */
  }
}

export function ActionsMenu({
  items,
  ariaLabel,
  buttonClassName = "rounded-lg p-1.5 hover:bg-elevated",
  iconClassName = "size-[15px]",
  align = "right",
}: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const visible = items.filter((item) => !item.hidden);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (visible.length === 0) return null;

  return (
    <div ref={rootRef} className="relative" data-actions-menu>
      <button
        type="button"
        className={buttonClassName}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal className={iconClassName} />
      </button>
      {open ? (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-30 mt-1 min-w-[11rem] overflow-hidden panel shadow-lg`}
          onClick={(event) => event.stopPropagation()}
        >
          {visible.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-elevated ${item.destructive ? "text-red-600" : ""}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                className={`block w-full px-3 py-2 text-left text-[11px] hover:bg-elevated ${item.destructive ? "text-red-600" : ""}`}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
