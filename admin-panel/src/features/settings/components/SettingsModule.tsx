"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Database, Globe, Lock, Moon, Save, Shield } from "lucide-react";

import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { apiDownload, apiFetch } from "@/lib/api";
import { Perm } from "@/lib/permissions";

const tabs = ["General", "Security", "Notifications", "Backups", "Integrations"] as const;

type BackupRow = {
  filename: string;
  kind: string;
  sizeBytes: number;
  createdAt: string;
  sha256?: string;
};

export default function SettingsModule() {
  const { theme, toggle } = useTheme();
  const { can, user } = useAuth();
  const canSave = can(Perm.settingsSystem) && !user?.viewOnly;
  const isSuper = user?.role === "super_admin";
  const [tab, setTab] = useState<(typeof tabs)[number]>("General");
  const [orgName, setOrgName] = useState("Nepal Hemophilia Society");
  const [locale, setLocale] = useState("en-NP");
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionMins, setSessionMins] = useState("45");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [saved, setSaved] = useState(false);
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [backupStatus, setBackupStatus] = useState("");
  const [backupBusy, setBackupBusy] = useState(false);

  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  async function downloadBackup(filename: string) {
    await apiDownload(
      `/backups/${encodeURIComponent(filename)}/download/`,
      filename.replace(/\.zip\.enc$/i, ".zip"),
    );
  }

  const loadBackups = useCallback(async (autoDownloadLatest = false) => {
    if (!isSuper) return;
    setBackupStatus("");
    try {
      const data = await apiFetch("/backups/");
      const rows = (data.backups ?? []) as BackupRow[];
      setBackups(rows);
      if (autoDownloadLatest && data.autoCreated && data.latest?.filename) {
        await downloadBackup(data.latest.filename);
        setBackupStatus(`Daily encrypted backup downloaded to this Super Admin device: ${data.latest.filename}`);
      }
    } catch (err) {
      setBackupStatus(err instanceof Error ? err.message : "Could not load backups");
    }
  }, [isSuper]);

  async function createManualBackup() {
    if (!isSuper || backupBusy) return;
    setBackupBusy(true);
    setBackupStatus("");
    try {
      const data = await apiFetch("/backups/", { method: "POST", body: JSON.stringify({ kind: "manual" }) });
      const filename = data.backup?.filename as string;
      await loadBackups(false);
      if (filename) {
        await downloadBackup(filename);
        setBackupStatus(`Manual backup created and downloaded: ${filename}`);
      }
    } catch (err) {
      setBackupStatus(err instanceof Error ? err.message : "Could not create backup");
    } finally {
      setBackupBusy(false);
    }
  }

  useEffect(() => {
    if (tab === "Backups" && isSuper) void loadBackups(true);
  }, [tab, isSuper, loadBackups]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">System Settings</h1>
          <p className="text-[11px] text-muted">Home &gt; System Settings · Super Admin only</p>
        </div>
        {canSave ? (
        <button
          type="button"
          onClick={save}
          className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
        >
          <Save className="size-3.5" />
          {saved ? "Saved" : "Save changes"}
        </button>
        ) : null}
      </div>

      <div className="tabs-bar">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`tab-link ${tab === item ? "tab-link-active" : ""}`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "General" ? (
        <div className="grid gap-2 lg:grid-cols-2">
          <article className="panel p-3">
            <h2 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <Globe className="size-3.5 text-brand" />
              Organization
            </h2>
            <label className="mt-3 block text-[10px] text-muted">Display name</label>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[11px] text-ink outline-none"
            />
            <label className="mt-3 block text-[10px] text-muted">Locale</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[11px] text-ink outline-none"
            >
              <option value="en-NP">English (Nepal)</option>
              <option value="ne-NP">नेपाली</option>
            </select>
          </article>
          <article className="panel p-3">
            <h2 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <Moon className="size-3.5 text-brand" />
              Appearance
            </h2>
            <p className="mt-2 text-[11px] text-muted">Current theme: {theme === "dark" ? "Dark" : "Light"}</p>
            <button type="button" onClick={toggle} className="panel mt-3 px-3 py-1.5 text-[11px] text-ink shadow-none">
              Toggle light / dark
            </button>
            <p className="mt-3 text-[10px] text-faint">Theme is stored locally and applied across the admin panel.</p>
          </article>
        </div>
      ) : null}

      {tab === "Security" ? (
        <div className="grid gap-2 lg:grid-cols-2">
          <article className="panel p-3">
            <h2 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <Lock className="size-3.5 text-brand" />
              Access control
            </h2>
            <label className="mt-3 flex items-center justify-between gap-3 text-[11px] text-ink">
              Require 2FA for admins
              <input type="checkbox" checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} />
            </label>
            <label className="mt-3 block text-[10px] text-muted">Idle session timeout (minutes)</label>
            <input
              value={sessionMins}
              onChange={(e) => setSessionMins(e.target.value)}
              className="mt-1 w-24 rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[11px] text-ink outline-none"
            />
          </article>
          <article className="panel p-3">
            <h2 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <Shield className="size-3.5 text-brand" />
              Policy snapshot
            </h2>
            <ul className="mt-3 space-y-2 text-[11px] text-muted">
              <li>Password rotation: 90 days</li>
              <li>Failed logins before device lock: 3 (5 minutes)</li>
              <li>Idle failed-attempt reset: 1 hour</li>
              <li>Admin JWT: 8 hour access / 12 hour refresh</li>
            </ul>
          </article>
        </div>
      ) : null}

      {tab === "Notifications" ? (
        <article className="panel p-3">
          <h2 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
            <Bell className="size-3.5 text-brand" />
            Alert channels
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="panel-inset flex items-center justify-between px-3 py-2 text-[11px] text-ink shadow-none">
              Email for low stock & expiry
              <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
            </label>
            <label className="panel-inset flex items-center justify-between px-3 py-2 text-[11px] text-ink shadow-none">
              SMS for emergency bleeds
              <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} />
            </label>
          </div>
        </article>
      ) : null}

      {tab === "Backups" ? (
        <article className="panel p-3">
          <h2 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
            <Database className="size-3.5 text-brand" />
            Encrypted backups
          </h2>
          {isSuper ? (
            <>
              <p className="mt-2 text-[11px] text-muted">
                Daily encrypted archives of users, admins, and clinical data. Files download only to this Super Admin
                device. Server keeps the last 14 backups.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void createManualBackup()}
                  disabled={backupBusy}
                  className="rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
                >
                  {backupBusy ? "Creating…" : "Create and download backup now"}
                </button>
                {backups[0] ? (
                  <button
                    type="button"
                    onClick={() => void downloadBackup(backups[0].filename)}
                    className="rounded border border-line px-3 py-1.5 text-[11px] font-semibold text-ink"
                  >
                    Download latest
                  </button>
                ) : null}
              </div>
              {backupStatus ? <p className="mt-2 text-[11px] text-brand">{backupStatus}</p> : null}
              <ul className="mt-3 space-y-1 text-[11px] text-muted">
                {backups.length === 0 ? (
                  <li>No backups yet. Create one or open this tab after 20 hours for an automatic daily backup.</li>
                ) : (
                  backups.slice(0, 8).map((row) => (
                    <li key={row.filename} className="flex items-center justify-between gap-2">
                      <span>
                        {row.kind} · {new Date(row.createdAt).toLocaleString()} · {Math.round(row.sizeBytes / 1024)} KB
                      </span>
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-brand"
                        onClick={() => void downloadBackup(row.filename)}
                      >
                        Download
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-[11px] text-muted">Only Super Admin can create or download backups.</p>
          )}
        </article>
      ) : null}

      {tab === "Integrations" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["DHIS2", "National HMIS sync — connected"],
            ["SMS Gateway", "Sparrow / NTC — sandbox"],
            ["Lab LIS", "Not configured"],
            ["eProcurement", "Read-only stock receipts"],
          ].map(([name, status]) => (
            <article key={name} className="panel p-3">
              <p className="text-[12px] font-semibold text-ink">{name}</p>
              <p className="mt-1 text-[11px] text-muted">{status}</p>
              <button type="button" className="mt-2 text-[11px] font-medium text-brand">
                Configure
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
