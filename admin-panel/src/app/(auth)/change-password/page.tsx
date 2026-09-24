"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/ui/PasswordField";
import { homeForUser, needsPasswordChange, type AuthUser, useAuth } from "@/lib/auth";
import { apiFetch, setAuthTokens } from "@/lib/api";
import { showToast } from "@/lib/toastBus";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, setSession } = useAuth();
  const expired = Boolean(user?.passwordExpired && !user?.must_change_password);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch("/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      if (!data.access || !data.user) {
        throw new Error("Password was not saved correctly. Please try again.");
      }
      setAuthTokens(data.access as string, data.refresh as string | undefined);
      setSession(data.user as AuthUser);
      router.replace(homeForUser(data.user as AuthUser));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setLoading(false);
    }
  }

  const subtitle = expired
    ? "For security, passwords must be changed every 90 days. Enter your current password and choose a new one (not one of your last 5 passwords)."
    : needsPasswordChange(user)
      ? "Your administrator issued a temporary password. Choose a new one of your own to activate this account."
      : "Choose a new password. It cannot match your current password or any of your last 5 passwords.";

  return (
    <AuthShell title={expired ? "Password expired" : "Set a new password"} subtitle={subtitle}>
        <form className="space-y-3" onSubmit={onSubmit}>
          <PasswordField
            label="Temporary / current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-2.5 text-[12px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save password"}
          </button>
        </form>
    </AuthShell>
  );
}
