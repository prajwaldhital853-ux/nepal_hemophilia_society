"use client";

import { AdminNotificationAlerts } from "@/components/layout/AdminNotificationAlerts";
import { BackupAutoDownload } from "@/components/layout/BackupAutoDownload";
import { NotificationPageSync } from "@/components/layout/NotificationPageSync";
import { Header } from "@/components/layout/Header";
import { MobileNavProvider, useMobileNav } from "@/components/layout/MobileNavContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { ViewOnlyBar } from "@/components/rbac/ReadOnlyBanner";
import { RouteGuard } from "@/lib/auth";

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
      <div className="isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <AdminNotificationAlerts />
        <NotificationPageSync />
        <BackupAutoDownload />
        <main className="admin-scroll relative z-0 flex min-h-0 flex-1 flex-col overflow-y-auto p-2.5 sm:p-3">
          <div className="mx-auto flex w-full min-w-0 max-w-[1360px] flex-1 flex-col">
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
