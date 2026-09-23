"use client";

import { useEffect, useRef } from "react";

import { apiDownload, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const KEY = "nhms-last-backup-download";

/** When a super admin logs in, download today's server backup once if not already saved locally. */
export function BackupAutoDownload() {
  const { user } = useAuth();
  const busy = useRef(false);

  useEffect(() => {
    if (!user || user.role !== "super_admin" || busy.current) return;
    busy.current = true;
    void (async () => {
      try {
        const data = await apiFetch("/backups/");
        const latest = data.latest as { filename?: string; createdAt?: string } | undefined;
        if (!latest?.filename) return;
        const stamp = latest.createdAt?.slice(0, 10) || latest.filename;
        if (localStorage.getItem(KEY) === stamp) return;
        await apiDownload(
          `/backups/${encodeURIComponent(latest.filename)}/download/`,
          latest.filename.replace(/\.zip\.enc$/i, ".zip"),
        );
        localStorage.setItem(KEY, stamp);
      } catch {
        // Backup list/download is optional on login.
      }
    })();
  }, [user]);

  return null;
}
