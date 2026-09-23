"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { needsPasswordChange, useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const expired = Boolean(user?.passwordExpired && !user?.must_change_password);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      logout();
      router.replace("/login?message=password-changed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page p-6">
      <div className="w-full max-w-md rounded border border-line bg-card p-6">
        <h1 className="text-[18px] font-semibold text-ink">{expired ? "Password expired" : "Set a new password"}</h1>
        <p className="mt-1 text-[11px] text-muted">
          {expired
            ? "For security, passwords must be changed every 90 days. Enter your current password and choose a new one (not one of your last 5 passwords)."
            : needsPasswordChange(user)
              ? "Your administrator issued a temporary password. Choose a new one of your own to activate this account."
              : "Choose a new password. It cannot match your current password or any of your last 5 passwords."}
        </p>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink">Temporary / current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded border border-line bg-elevated px-2.5 py-1.5 text-[11px] text-ink outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded border border-line bg-elevated px-2.5 py-1.5 text-[11px] text-ink outline-none"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded border border-line bg-elevated px-2.5 py-1.5 text-[11px] text-ink outline-none"
              required
              minLength={8}
            />
          </div>
          {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-brand py-2 text-[11px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
    </main>
  );
}
