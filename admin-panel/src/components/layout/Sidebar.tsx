"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { NavIcon } from "@/components/layout/NavIcon";
import { useAuth } from "@/lib/auth";
import { filterNav, mainNav, websiteNav, type NavItem } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isGroupActive(pathname: string, item: NavItem) {
  if (item.children?.length) {
    return item.children.some((child) => isActive(pathname, child.href)) || isActive(pathname, item.href);
  }
  return isActive(pathname, item.href);
}

function NavLink({
  item,
  pathname,
  nested = false,
}: {
  item: NavItem | { href: string; label: string };
  pathname: string;
  nested?: boolean;
}) {
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={`relative flex items-center gap-2 rounded px-2 py-[6px] text-[12px] transition-colors duration-200 ${
        nested ? "pl-7" : ""
      } ${
        active
          ? "nav-active font-semibold text-white"
          : "text-sidebar-muted hover:bg-elevated/10 hover:text-sidebar-ink"
      }`}
    >
      {!nested && active ? <span className="absolute bottom-1 left-0 top-1 w-0.5 rounded-r bg-sky-300" /> : null}
      {"icon" in item ? <NavIcon name={item.icon} className="size-3.5 shrink-0" /> : null}
      <span className="min-w-0 flex-1 truncate leading-4">{item.label}</span>
      {"badge" in item && item.badge ? (
        <span className="rounded-full bg-red px-1 py-0.5 text-[8px] font-bold text-white">{item.badge}</span>
      ) : null}
    </Link>
  );
}

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const groupActive = isGroupActive(pathname, item);
  const [open, setOpen] = useState(groupActive);

  const expanded = open || groupActive;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex w-full items-center gap-2 rounded px-2 py-[6px] text-left text-[12px] transition-colors duration-200 ${
          groupActive && !expanded
            ? "nav-active font-semibold text-white"
            : groupActive
              ? "font-semibold text-sidebar-ink"
              : "text-sidebar-muted hover:bg-elevated/10 hover:text-sidebar-ink"
        }`}
      >
        {groupActive ? <span className="absolute bottom-1 left-0 top-1 w-0.5 rounded-r bg-sky-300" /> : null}
        <NavIcon name={item.icon} className="size-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate leading-4">{item.label}</span>
        <ChevronDown className={`size-3 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && item.children ? (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {item.children.map((child) => (
            <NavLink key={child.href} item={child} pathname={pathname} nested />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const allowed = user?.nav ?? [];
  const mainItems = filterNav(mainNav, allowed);
  const siteItems = filterNav(websiteNav, allowed);
  const displayName = user?.fullName || user?.username || "Admin";
  const roleLabel =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "province_admin"
        ? `Province Admin${user.provinceAdmin?.province ? ` · ${user.provinceAdmin.province}` : ""}`
        : user?.hospitalStaff
          ? `${user.hospitalStaff.staffType === "center_admin" ? "Center Admin" : "Treatment Admin"} · ${user.hospitalStaff.treatmentCenter}`
          : "Hospital Admin";

  return (
    <aside className="flex h-dvh w-[var(--sidebar-w)] shrink-0 flex-col overflow-hidden border-r border-sidebar-line bg-sidebar text-sidebar-ink">
      <div className="flex h-[var(--topbar-h)] shrink-0 items-center gap-2 border-b border-sidebar-line px-3">
        <Image src="/nhs-logo.png" alt="NHS logo" width={32} height={38} className="h-9 w-8 object-contain" />
        <p className="text-[9px] font-extrabold leading-[11px] tracking-[0.2px]">
          NEPAL HEMOPHILIA
          <br />
          DIGITAL MANAGEMENT
          <br />
          SYSTEM
        </p>
      </div>

      <nav className="admin-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <p className="mb-1.5 px-2 text-[9px] font-semibold tracking-[1.2px] text-sidebar-muted">MAIN</p>
        <div className="flex flex-col gap-0.5">
          {mainItems.map((item) =>
            item.children?.length ? (
              <NavGroup key={item.href} item={item} pathname={pathname} />
            ) : (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ),
          )}
        </div>

        {siteItems.length ? (
          <>
            <p className="mb-1.5 mt-4 px-2 text-[9px] font-semibold tracking-[1.2px] text-sidebar-muted">
              WEBSITE MANAGEMENT
            </p>
            <div className="flex flex-col gap-0.5">
              {siteItems.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </>
        ) : null}
      </nav>

      <div className="shrink-0 border-t border-sidebar-line px-2 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-elevated/10 px-2 py-2">
          <Image
            src="/patient-ravi.jpg"
            alt={displayName}
            width={28}
            height={28}
            className="size-7 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-sidebar-ink">{displayName}</p>
            <p className="truncate text-[10px] text-sidebar-muted">{roleLabel}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-status-green">
              <span className="size-1.5 rounded-full bg-status-green" />
              Online
            </p>
            <button type="button" onClick={logout} className="mt-1 text-[10px] text-sidebar-muted hover:text-white">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
