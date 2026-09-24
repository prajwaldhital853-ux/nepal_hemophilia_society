"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { apiFetch } from "@/lib/api";
import { storeResetEmail } from "@/lib/passwordResetSession";
import { showToast } from "@/lib/toastBus";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      showToast("Enter the email address registered to your admin account.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch("/auth/forgot-password/", {
        method: "POST",
        skipAuthRedirect: true,
        body: JSON.stringify({ email: value }),
      });
      if (!data.otpSent) {
        showToast("No verification code was sent for this email.");
        return;
      }
      storeResetEmail(value);
      router.push("/verify-otp");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not send verification code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter the official email on your admin account. We will send a one-time code if it matches our records."
      backHref="/login"
      backLabel="Back to sign in"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink">Admin email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-line bg-elevated py-2 pl-9 pr-3 text-[12px] text-ink outline-none ring-brand/30 transition focus:ring-2"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>
          <p className="text-[10px] leading-4 text-muted">
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-2.5 text-[12px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
          >
            {loading ? "Sending code…" : "Send verification code"}
          </button>
        </form>
    </AuthShell>
  );
}
