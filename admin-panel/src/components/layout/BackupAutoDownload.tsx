"use client";

import { useEffect, useRef } from "react";

import { apiDownload, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const KEY = "nhms-last-backup-download";

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

/** When a super admin logs in, create (if needed) and download the latest backup once per calendar day. */
export function BackupAutoDownload() {
  const { user } = useAuth();
  const busy = useRef(false);

  useEffect(() => {
    if (!user || user.role !== "super_admin" || busy.current) return;
    const day = todayKey();
    if (localStorage.getItem(KEY) === day) return;

    busy.current = true;
    void (async () => {
      try {
        const data = await apiFetch("/backups/");
        const latest = data.latest as { filename?: string } | undefined;
        if (!latest?.filename) return;
        await apiDownload(
          `/backups/${encodeURIComponent(latest.filename)}/download/`,
          latest.filename.replace(/\.zip\.enc$/i, ".zip"),
        );
        localStorage.setItem(KEY, day);
      } catch {
        // Backup list/download is optional on login.
      } finally {
        busy.current = false;
      }
    })();
  }, [user]);

  return null;
}
