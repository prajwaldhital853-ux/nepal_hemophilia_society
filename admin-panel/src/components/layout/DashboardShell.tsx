"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { PAGE_NOTIFICATION_TOPICS } from "@/components/layout/notificationHref";
import { apiFetch } from "@/lib/api";
import { MobileNavProvider, useMobileNav } from "@/components/layout/MobileNavContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { ViewOnlyBar } from "@/components/rbac/ReadOnlyBanner";
import { RouteGuard } from "@/lib/auth";

function ClearOpenedPageAlerts() {
  const pathname = usePathname();
  useEffect(() => {
    const match = PAGE_NOTIFICATION_TOPICS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    if (!match) return;
    void apiFetch("/notifications/admin/seen/", {
      method: "POST",
      body: JSON.stringify({ topics: match[1] }),
    })
      .then(() => window.dispatchEvent(new Event("nhms-notifications-refresh")))
      .catch(() => undefined);
  }, [pathname]);
  return null;
}

function DashboardFrame({ children }: { children: React.ReactNode }) {
  const { open, closeNav } = useMobileNav();

  return (
    <div className="flex h-dvh overflow-hidden bg-page">
      {open ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] lg:hidden"
          onClick={closeNav}
        />
      ) : null}
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <ClearOpenedPageAlerts />
        <main className="admin-scroll flex min-h-0 flex-1 flex-col overflow-y-auto p-2.5 sm:p-3">
          <div className="animate-pageIn mx-auto w-full max-w-[1360px]">
            <ViewOnlyBar />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <MobileNavProvider>
        <DashboardFrame>{children}</DashboardFrame>
      </MobileNavProvider>
    </RouteGuard>
  );
}
