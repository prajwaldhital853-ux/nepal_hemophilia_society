"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth";
import { ApiClientError, apiFetch } from "@/lib/api";
import { finishAdminLogin } from "@/lib/completeAdminLogin";
import { showToast } from "@/lib/toastBus";
import { clearPreAuthToken, readPreAuthToken } from "@/lib/twoFactorSession";

export default function VerifyTwoFactorPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!readPreAuthToken()) {
      router.replace("/login");
    }
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const preAuthToken = readPreAuthToken();
    if (!preAuthToken) {
      router.replace("/login");
      return;
    }
    const normalized = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(normalized)) {
      showToast("Enter the 6-digit code from Google Authenticator.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch("/auth/2fa/verify/", {
        method: "POST",
        skipAuthRedirect: true,
        body: JSON.stringify({ preAuthToken, code: normalized }),
      });
      finishAdminLogin(data, setSession, router);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "totp_locked") {
        clearPreAuthToken();
        showToast(err.message);
        router.replace("/login");
        return;
      }
      showToast(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Authenticator code"
      subtitle="Open Google Authenticator (or any TOTP app) and enter the current 6-digit code. A new code appears every 30 seconds."
      backHref="/login"
      backLabel="Back to sign in"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink">6-digit code</label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-line bg-elevated py-2 pl-9 pr-3 text-center font-mono text-[18px] tracking-[0.35em] text-ink outline-none ring-brand/30 transition focus:ring-2"
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand py-2.5 text-[12px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
        >
          {loading ? "Verifying…" : "Verify and sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
