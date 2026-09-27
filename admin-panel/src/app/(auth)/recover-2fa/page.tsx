"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { ApiClientError, apiFetch } from "@/lib/api";
import { showToast } from "@/lib/toastBus";
import { storeRecoverSetup } from "@/lib/twoFactorRecovery";
import { clearPreAuthToken, readPreAuthToken, storePreAuthToken } from "@/lib/twoFactorSession";

export default function RecoverTwoFactorPage() {
  const router = useRouter();
  const [backupCode, setBackupCode] = useState("");
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
    const normalized = backupCode.replace(/\s/g, "").toUpperCase();
    if (normalized.replace(/-/g, "").length < 12) {
      showToast("Enter one of your backup recovery codes.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch("/auth/2fa/recover/", {
        method: "POST",
        skipAuthRedirect: true,
        body: JSON.stringify({ preAuthToken, backupCode: normalized }),
      });
      if (!data.preAuthToken) {
        throw new Error("Recovery could not continue. Sign in again.");
      }
      storePreAuthToken(String(data.preAuthToken));
      storeRecoverSetup({
        qrCodeDataUrl: data.qrCodeDataUrl as string | undefined,
        secret: data.secret as string | undefined,
        otpauthUrl: data.otpauthUrl as string | undefined,
      });
      router.push("/setup-2fa?recover=1");
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "totp_locked") {
        clearPreAuthToken();
        showToast(err.message);
        router.replace("/login");
        return;
      }
      showToast(err instanceof Error ? err.message : "Recovery failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Use a backup code"
      subtitle="Enter one of the three backup codes you saved when you first set up two-factor authentication. Each code works once."
      backHref="/verify-2fa"
      backLabel="Back to authenticator code"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink">Backup recovery code</label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 14))}
              className="w-full rounded-xl border border-line bg-elevated py-2 pl-9 pr-3 font-mono text-[15px] tracking-wide text-ink outline-none ring-brand/30 transition focus:ring-2"
              placeholder="XXXX-XXXX-XXXX"
              autoComplete="off"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand py-2.5 text-[12px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
        >
          {loading ? "Checking…" : "Verify backup code"}
        </button>
        <p className="text-center text-[11px] text-muted">
          No backup codes left?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Contact a super admin
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
