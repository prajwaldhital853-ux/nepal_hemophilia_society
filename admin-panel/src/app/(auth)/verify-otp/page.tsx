"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { apiFetch } from "@/lib/api";
import { readResetEmail, storeResetToken } from "@/lib/passwordResetSession";
import { showToast } from "@/lib/toastBus";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = readResetEmail();
    if (!stored) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(stored);
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) {
      showToast("Enter the verification code from your email.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch("/auth/verify-reset-otp/", {
        method: "POST",
        skipAuthRedirect: true,
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      if (!data.resetToken) throw new Error("Verification failed");
      storeResetToken(data.resetToken as string);
      showToast("Code verified. Set your new password.");
      router.push("/reset-password");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not verify code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Verify email code"
      subtitle={email ? `Enter the code sent to ${email}. It expires in 5 minutes.` : "Enter your verification code."}
      backHref="/forgot-password"
      backLabel="Use a different email"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink">Verification code</label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-xl border border-line bg-elevated py-2 pl-9 pr-3 font-mono text-[14px] tracking-widest text-ink outline-none ring-brand/30 transition focus:ring-2"
              placeholder="g4j7D5#"
              autoComplete="one-time-code"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-xl bg-brand py-2.5 text-[12px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
        >
          {loading ? "Verifying…" : "Verify and continue"}
        </button>
      </form>
    </AuthShell>
  );
}
