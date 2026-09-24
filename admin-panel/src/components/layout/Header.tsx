"use client";

import Link from "next/link";
import { ChevronDown, Menu, Moon, Sun } from "lucide-react";

import { AppointmentInbox } from "@/components/layout/AppointmentInbox";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { KeyboardShortcutsButton } from "@/components/layout/KeyboardShortcutsProvider";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useMobileNav } from "@/components/layout/MobileNavContext";
import { OwnAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from "@/lib/auth";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLocale } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

function roleKey(role?: string, staffType?: string) {
  if (role === "super_admin") return "roles.super_admin";
  if (role === "admin") return "roles.admin";
  if (role === "website_manager") return "roles.website_manager";
  if (role === "province_admin") return "roles.province_admin";
  if (staffType === "center_admin") return "roles.center_admin";
  if (role === "hospital_admin") return "roles.hospital_admin";
  return "roles.hospital_admin";
}

export function Header() {
  const { theme, ready, toggle } = useTheme();
  const { t } = useLocale();
  const { user } = useAuth();
  const { toggleNav } = useMobileNav();
  const displayName = user?.fullName || user?.username || "Admin";
  const roleLabel = t(roleKey(user?.role, user?.hospitalStaff?.staffType));

  return (
    <header className="panel relative z-40 flex h-[var(--topbar-h)] shrink-0 items-center gap-2 overflow-visible bg-card px-2.5 shadow-none">
      <button
        type="button"
        className="rounded p-1 text-muted hover:bg-elevated lg:hidden"
        aria-label={t("common.openMenu")}
        onClick={toggleNav}
      >
        <Menu className="size-4" />
      </button>

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1.5 overflow-visible">
        <KeyboardShortcutsButton />
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

        <LanguageToggle />

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
