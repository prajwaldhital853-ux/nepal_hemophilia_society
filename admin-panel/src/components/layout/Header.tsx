"use client";

import Image from "next/image";
import { Bell, ChevronDown, Mail, Menu, Moon, Search, Sun } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export function Header() {
  const { theme, ready, toggle } = useTheme();
  const { user } = useAuth();
  const displayName = user?.fullName || user?.username || "Admin";
  const roleLabel =
    user?.role === "super_admin"
      ? "Super Administrator"
      : user?.role === "province_admin"
        ? "Province Administrator"
        : user?.hospitalStaff?.staffType === "center_admin"
          ? "Center Administrator"
          : "Hospital Administrator";

  return (
    <header className="panel flex h-[var(--topbar-h)] shrink-0 items-center gap-2 bg-card px-2.5 shadow-none">
      <button type="button" className="rounded p-1 text-muted hover:bg-elevated" aria-label="Menu">
        <Menu className="size-4" />
      </button>

      <label className="panel-inset flex h-7 max-w-lg flex-1 items-center gap-2 px-2 shadow-none">
        <Search className="size-3.5 text-faint" />
        <input
          className="w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
          placeholder="Search patients, hospitals, stock, ID..."
        />
      </label>

      <div className="ml-auto flex items-center gap-1.5">
        <button type="button" className="relative panel p-1.5 text-muted shadow-none hover:bg-elevated hover:text-ink" aria-label="Notifications">
          <Bell className="size-4" />
          <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-red text-[8px] font-bold text-white">
            12
          </span>
        </button>
        <button type="button" className="relative panel p-1.5 text-muted shadow-none hover:bg-elevated hover:text-ink" aria-label="Messages">
          <Mail className="size-4" />
          <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-red text-[8px] font-bold text-white">
            7
          </span>
        </button>

        <button
          type="button"
          onClick={toggle}
          className="panel p-1.5 text-muted shadow-none hover:bg-elevated hover:text-ink"
          aria-label={ready && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          suppressHydrationWarning
        >
          {!ready ? <Moon className="size-4" /> : theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>

        <button type="button" className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-ink hover:bg-elevated">
          <span className="text-sm leading-none">🇳🇵</span>
          EN
          <ChevronDown className="size-3 text-faint" />
        </button>

        <button type="button" className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-elevated">
          <Image
            src="/patient-ravi.jpg"
            alt={displayName}
            width={28}
            height={28}
            className="size-7 rounded-full object-cover"
          />
          <span className="hidden text-left sm:block">
            <span className="block text-[12px] font-semibold text-ink">{displayName}</span>
            <span className="block text-[10px] text-muted">{roleLabel}</span>
          </span>
          <ChevronDown className="size-3.5 text-faint" />
        </button>
      </div>
    </header>
  );
}
