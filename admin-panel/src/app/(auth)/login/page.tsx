"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { homeForUser, persistUser, type AuthUser } from "@/lib/auth";
import { apiFetch, setAccessToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPassword("");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login/", {
        method: "POST",
        skipAuthRedirect: true,
        body: JSON.stringify({ username, password }),
      });
      if (!data.access) throw new Error("Login failed");
      if (data.user?.role === "patient") {
        throw new Error("Patient accounts cannot use the admin panel");
      }
      setAccessToken(data.access);
      if (data.user) persistUser(data.user as AuthUser);
      if (data.mustChangePassword || data.user?.must_change_password) {
        router.push("/change-password");
        return;
      }
      router.push(data.user ? homeForUser(data.user as AuthUser) : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-6">
      <div className="w-full max-w-md rounded border border-line bg-card p-6">
        <h1 className="text-[18px] font-semibold text-ink">Admin Login</h1>
        <p className="mt-1 text-[11px] text-muted">
          Only hospital, province, or super admins can create patient records. Patients cannot self-register.
        </p>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded border border-line bg-elevated px-2.5 py-1.5 text-[11px] text-ink outline-none"
              autoComplete="username"
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
            />
          </div>
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-brand py-2 text-[11px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
