"use client";

import Link from "next/link";
import { ChevronDown, Menu, Moon, Search, Sun } from "lucide-react";

import { AppointmentInbox } from "@/components/layout/AppointmentInbox";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useMobileNav } from "@/components/layout/MobileNavContext";
import { OwnAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export function Header() {
  const { theme, ready, toggle } = useTheme();
  const { user } = useAuth();
  const { toggleNav } = useMobileNav();
  const displayName = user?.fullName || user?.username || "Admin";
  const roleLabel =
    user?.role === "super_admin"
      ? "Super Administrator"
      : user?.role === "admin"
        ? "Administrator"
        : user?.role === "website_manager"
          ? "Website Manager"
          : user?.role === "province_admin"
            ? "Province Administrator"
            : user?.hospitalStaff?.staffType === "center_admin"
              ? "Center Administrator"
              : "Hospital Administrator";

  return (
    <header className="panel relative z-30 flex h-[var(--topbar-h)] shrink-0 items-center gap-2 overflow-visible bg-card px-2.5 shadow-none">
      <button
        type="button"
        className="rounded p-1 text-muted hover:bg-elevated lg:hidden"
        aria-label="Open navigation menu"
        onClick={toggleNav}
      >
        <Menu className="size-4" />
      </button>

      <label className="panel-inset hidden h-7 max-w-lg flex-1 items-center gap-2 px-2 shadow-none sm:flex">
        <Search className="size-3.5 text-faint" />
        <input
          className="w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-faint"
          placeholder="Search patients, hospitals, stock, ID..."
        />
      </label>

      <div className="ml-auto flex items-center gap-1.5 overflow-visible">
        <NotificationBell />
        <AppointmentInbox />

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

        <Link
          href="/dashboard/profile"
          className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-elevated"
          title="My profile"
        >
          <OwnAvatar name={displayName} photoUrl={user?.photoUrl} size={28} />
          <span className="hidden text-left sm:block">
            <span className="block text-[12px] font-semibold text-ink">{displayName}</span>
            <span className="block text-[10px] text-muted">{roleLabel}</span>
          </span>
          <ChevronDown className="size-3.5 text-faint" />
        </Link>
      </div>
    </header>
  );
}
