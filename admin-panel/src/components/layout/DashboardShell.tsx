"use client";

import { useEffect } from "react";

import { AdminNotificationAlerts } from "@/components/layout/AdminNotificationAlerts";
import { BackupAutoDownload } from "@/components/layout/BackupAutoDownload";
import { NotificationPageSync } from "@/components/layout/NotificationPageSync";
import { FullScreenExitFloating, FullScreenModeProvider, useFullScreenMode } from "@/components/layout/FullScreenModeContext";
import { Header } from "@/components/layout/Header";
import { KeyboardShortcutsProvider } from "@/components/layout/KeyboardShortcutsProvider";
import { MobileNavProvider, useMobileNav } from "@/components/layout/MobileNavContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { ViewOnlyBar } from "@/components/rbac/ReadOnlyBanner";
import { RouteGuard } from "@/lib/auth";

function DashboardFrame({ children }: { children: React.ReactNode }) {
  const { open, closeNav } = useMobileNav();
  const { immersive } = useFullScreenMode();

  useEffect(() => {
    if (immersive) closeNav();
  }, [immersive, closeNav]);

  return (
    <div className="flex h-dvh overflow-hidden bg-page">
      {open && !immersive ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] lg:hidden"
          onClick={closeNav}
        />
      ) : null}
      {!immersive ? <Sidebar /> : null}
      <div className="isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {!immersive ? <Header /> : null}
        <FullScreenExitFloating />
        {!immersive ? <AdminNotificationAlerts /> : null}
        <NotificationPageSync />
        <BackupAutoDownload />
        <main
          className={`admin-scroll relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden ${
            immersive ? "p-1.5 sm:p-2" : "p-2.5 sm:p-3"
          }`}
        >
          <div
            className={`mx-auto flex h-full min-h-0 w-full min-w-0 flex-1 flex-col ${
              immersive ? "max-w-none" : "max-w-[1360px]"
            }`}
          >
            {!immersive ? <ViewOnlyBar /> : null}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
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
        <FullScreenModeProvider>
          <KeyboardShortcutsProvider>
            <DashboardFrame>{children}</DashboardFrame>
          </KeyboardShortcutsProvider>
        </FullScreenModeProvider>
      </MobileNavProvider>
    </RouteGuard>
  );
}
