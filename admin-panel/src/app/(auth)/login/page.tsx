"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/ui/PasswordField";
import { homeForUser, type AuthUser, useAuth } from "@/lib/auth";
import { ApiClientError, apiFetch, setAuthTokens } from "@/lib/api";
import { REMEMBER_KEY, readRememberedUsername, setRememberMe } from "@/lib/authStorage";
import { showToast } from "@/lib/toastBus";
import { ensureAdminDeviceId, getAdminDeviceAuth } from "@/lib/deviceId";

function formatRemaining(untilIso?: string, fallbackSeconds?: number) {
  const until = untilIso ? new Date(untilIso).getTime() : Date.now() + (fallbackSeconds ?? 0) * 1000;
  const seconds = Math.max(0, Math.ceil((until - Date.now()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return { seconds, label: `${minutes}:${String(rest).padStart(2, "0")}` };
}

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMeChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState("");
  const [lockLabel, setLockLabel] = useState("");

  useEffect(() => {
    setPassword("");
    ensureAdminDeviceId();
    setRememberMeChecked(localStorage.getItem(REMEMBER_KEY) === "1");
    setUsername(readRememberedUsername());
    if (window.location.search.includes("password-changed")) {
      setPasswordChanged(true);
    }
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const next = formatRemaining(lockedUntil);
      setLockLabel(next.label);
      if (next.seconds <= 0) {
        setLockedUntil("");
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { deviceId, deviceSignals } = await getAdminDeviceAuth();
      const data = await apiFetch("/auth/login/", {
        method: "POST",
        skipAuthRedirect: true,
        body: JSON.stringify({ username, password, deviceId, deviceSignals }),
      });
      if (!data.access) throw new Error("Login failed");
      if (data.user?.role === "patient") {
        throw new Error("Patient accounts cannot use the admin panel");
      }
      setRememberMe(rememberMe, username.trim());
      setAuthTokens(data.access, data.refresh);
      if (data.user) setSession(data.user as AuthUser);
      if (data.mustChangePassword || data.passwordExpired || data.user?.must_change_password || data.user?.passwordExpired) {
        router.push("/change-password");
        return;
      }
      router.push(data.user ? homeForUser(data.user as AuthUser) : "/dashboard");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === "device_locked" || err.status === 423) {
          setLockedUntil(err.lockedUntil || new Date(Date.now() + (err.retryAfterSeconds || 300) * 1000).toISOString());
          showToast(err.message);
        } else if (err.attemptsRemaining != null) {
          showToast(`${err.message} Attempts left on this device: ${err.attemptsRemaining}.`);
        } else {
          showToast(err.message);
        }
      } else {
        showToast(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  const locked = Boolean(lockedUntil);

  return (
    <AuthShell title="Admin sign in" subtitle="Use your username, official email, or Admin ID.">
      {passwordChanged ? (
        <p className="mb-4 rounded-xl bg-brand-soft px-3 py-2.5 text-[11px] text-brand">
          Password updated successfully. Sign in with your new password.
        </p>
      ) : null}
      <form className="space-y-3.5" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink">Username, email, or Admin ID</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-line bg-elevated px-3 py-2 text-[12px] text-ink outline-none ring-brand/30 transition focus:ring-2"
            autoComplete="username"
            disabled={locked}
          />
        </div>
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={locked}
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMeChecked(e.target.checked)}
              className="size-3.5 rounded border border-line accent-brand"
              disabled={locked}
            />
            <span className="text-[11px] text-ink">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-[11px] font-semibold text-brand hover:underline">
            Forgot password?
          </Link>
        </div>
        {locked ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Device locked. Try again in {lockLabel}.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading || locked}
          className="w-full rounded-xl bg-brand py-2.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-brand-blueDark disabled:opacity-60"
        >
          {loading ? "Signing in…" : locked ? `Locked (${lockLabel})` : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
