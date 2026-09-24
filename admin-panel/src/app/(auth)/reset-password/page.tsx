"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { clearResetSession, readResetToken } from "@/lib/passwordResetSession";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/ui/PasswordField";
import { apiFetch } from "@/lib/api";
import { showToast } from "@/lib/toastBus";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!readResetToken()) {
      router.replace("/forgot-password");
    }
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resetToken = readResetToken();
    if (!resetToken) {
      router.replace("/forgot-password");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password/", {
        method: "POST",
        skipAuthRedirect: true,
        body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
      });
      clearResetSession();
      showToast("Password updated. Sign in with your new password.");
      router.replace("/login?password-changed=1");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create new password"
      subtitle="Choose a strong password that is different from your last 5 passwords."
      backHref="/verify-otp"
      backLabel="Back to verification"
    >
      <form className="space-y-3.5" onSubmit={onSubmit}>
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
          {loading ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthShell>
  );
}
