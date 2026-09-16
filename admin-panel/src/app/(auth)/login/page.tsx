"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { homeForUser, type AuthUser, useAuth } from "@/lib/auth";
import { ApiClientError, apiFetch, setAuthTokens } from "@/lib/api";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState("");
  const [lockLabel, setLockLabel] = useState("");

  useEffect(() => {
    setPassword("");
    ensureAdminDeviceId();
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const next = formatRemaining(lockedUntil);
      setLockLabel(next.label);
      if (next.seconds <= 0) {
        setLockedUntil("");
        setError("");
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
      setAuthTokens(data.access, data.refresh);
      if (data.user) setSession(data.user as AuthUser);
      if (data.mustChangePassword || data.user?.must_change_password) {
        router.push("/change-password");
        return;
      }
      router.push(data.user ? homeForUser(data.user as AuthUser) : "/dashboard");
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.code === "device_locked" || err.status === 423) {
          setLockedUntil(err.lockedUntil || new Date(Date.now() + (err.retryAfterSeconds || 300) * 1000).toISOString());
          setError(err.message);
        } else if (err.attemptsRemaining != null) {
          setError(`${err.message} Attempts left on this device: ${err.attemptsRemaining}.`);
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  }

  const locked = Boolean(lockedUntil);

  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-6">
      <div className="w-full max-w-md rounded border border-line bg-card p-6">
        <h1 className="text-[18px] font-semibold text-ink">Admin Login</h1>
        <p className="mt-1 text-[11px] text-muted">
          Sign in with your username, official email, or Admin ID. This physical device (all browsers on this PC) is
          locked for 5 minutes after 3 failed
          attempts. Unused attempts reset after 1 hour.
        </p>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink">Username, email, or Admin ID</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded border border-line bg-elevated px-2.5 py-1.5 text-[11px] text-ink outline-none"
              autoComplete="username"
              disabled={locked}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-line bg-elevated px-2.5 py-1.5 text-[11px] text-ink outline-none"
              autoComplete="current-password"
              disabled={locked}
            />
          </div>
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
          {locked ? (
            <p className="text-[11px] font-semibold text-amber-700">Device locked. Try again in {lockLabel}.</p>
          ) : null}
          <button
            type="submit"
            disabled={loading || locked}
            className="w-full rounded bg-brand py-2 text-[11px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
          >
            {loading ? "Signing in…" : locked ? `Locked (${lockLabel})` : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
