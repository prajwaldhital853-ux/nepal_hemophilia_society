"use client";

import { useState } from "react";
import { Bell, Database, Globe, Lock, Moon, Save, Shield } from "lucide-react";

import { useTheme } from "@/lib/theme";

const tabs = ["General", "Security", "Notifications", "Backups", "Integrations"] as const;

export default function SettingsModule() {
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState<(typeof tabs)[number]>("General");
  const [orgName, setOrgName] = useState("Nepal Hemophilia Society");
  const [locale, setLocale] = useState("en-NP");
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionMins, setSessionMins] = useState("45");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [backupHour, setBackupHour] = useState("02:30");
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-[15px] font-semibold text-ink">System Settings</h1>
          <p className="text-[11px] text-muted">Home &gt; System Settings · Super Admin only</p>
        </div>
        <button
          type="button"
          onClick={save}
          className="flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-blueDark"
        >
          <Save className="size-3.5" />
          {saved ? "Saved" : "Save changes"}
        </button>
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
              <li>Failed logins before lock: 5</li>
              <li>IP allow-list: provincial offices + VPN</li>
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
            Nightly backup
          </h2>
          <label className="mt-3 block text-[10px] text-muted">Run at (NPT)</label>
          <input
            type="time"
            value={backupHour}
            onChange={(e) => setBackupHour(e.target.value)}
            className="mt-1 rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[11px] text-ink outline-none"
          />
          <p className="mt-3 text-[11px] text-muted">Last successful backup: May 16, 2025 02:31 AM · encrypted object store</p>
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
