"use client";

import { pageRbac, type PageKey } from "@/lib/rbac";
import { useAuth } from "@/lib/auth";

export function usePageRbac(page: PageKey) {
  const { user } = useAuth();
  return pageRbac(user, page);
}

export function ReadOnlyBanner({ label }: { label?: string }) {
  return (
    <p className="rounded border border-line bg-elevated px-3 py-2 text-[11px] text-muted">
      View-only access{label ? ` on ${label}` : ""} — create, edit, and delete actions are disabled. Ask a Super Admin
      or Admin to grant write permissions if you need them.
    </p>
  );
}

export function ViewOnlyBar() {
  const { user } = useAuth();
  if (!user?.viewOnly) return null;
  return (
    <div className="mb-2">
      <ReadOnlyBanner />
    </div>
  );
}
