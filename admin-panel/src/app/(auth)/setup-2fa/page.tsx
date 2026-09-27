"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { BackupCodesPanel } from "@/components/auth/BackupCodesPanel";
import { clearRecoverSetup, isRecoverSetupRoute, readRecoverSetup } from "@/lib/twoFactorRecovery";
import { useAuth, type AuthUser } from "@/lib/auth";
import { ApiClientError, apiFetch } from "@/lib/api";
import { finishAdminLogin } from "@/lib/completeAdminLogin";
import { showToast } from "@/lib/toastBus";
import { clearPreAuthToken, readPreAuthToken } from "@/lib/twoFactorSession";

type SetupPayload = {
  qrCodeDataUrl?: string;
  secret?: string;
  otpauthUrl?: string;
};

type PendingLogin = {
  access?: string;
  refresh?: string;
  user?: AuthUser;
  mustChangePassword?: boolean;
  passwordExpired?: boolean;
};

export default function SetupTwoFactorPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [isRecovery, setIsRecovery] = useState(false);
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [code, setCode] = useState("");
  const [loadingSetup, setLoadingSetup] = useState(true);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [pendingLogin, setPendingLogin] = useState<PendingLogin | null>(null);

  useEffect(() => {
    const recovery = isRecoverSetupRoute();
    setIsRecovery(recovery);
    const preAuthToken = readPreAuthToken();
    if (!preAuthToken) {
      router.replace("/login");
      return;
    }

    const cachedRecover = recovery ? readRecoverSetup() : null;
    if (cachedRecover?.qrCodeDataUrl) {
      setSetup(cachedRecover);
      setLoadingSetup(false);
      return;
    }

    void (async () => {
      try {
        const data = await apiFetch("/auth/2fa/setup/", {
          method: "POST",
          skipAuthRedirect: true,
          body: JSON.stringify({ preAuthToken }),
        });
        setSetup(data as SetupPayload);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Could not start 2FA setup");
        router.replace("/login");
      } finally {
        setLoadingSetup(false);
      }
    })();
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
      showToast("Enter the 6-digit code shown in your authenticator app.");
      return;
    }
    setLoadingConfirm(true);
    try {
      const data = await apiFetch("/auth/2fa/confirm/", {
        method: "POST",
        skipAuthRedirect: true,
        body: JSON.stringify({ preAuthToken, code: normalized }),
      });
      clearRecoverSetup();
      const codes = Array.isArray(data.backupCodes) ? (data.backupCodes as string[]) : null;
      if (codes?.length) {
        setPendingLogin(data as PendingLogin & { backupCodes?: string[] });
        setBackupCodes(codes);
        return;
      }
      finishAdminLogin(data, setSession, router);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "totp_locked") {
        clearPreAuthToken();
        clearRecoverSetup();
        showToast(err.message);
        router.replace("/login");
        return;
      }
      showToast(err instanceof Error ? err.message : "Could not confirm setup");
    } finally {
      setLoadingConfirm(false);
    }
  }

  function finishAfterBackupCodes() {
    if (!pendingLogin) return;
    finishAdminLogin(pendingLogin, setSession, router);
  }

  const title = isRecovery ? "Set up a new authenticator" : "Set up two-factor authentication";
  const subtitle = isRecovery
    ? "Your backup code was accepted. Scan this new QR code, then enter the 6-digit code. Your old authenticator and backup codes no longer work."
    : "Scan the QR code with Google Authenticator, then enter the 6-digit code to finish setup. You will need a code every time you sign in.";

  if (backupCodes?.length) {
    return (
      <AuthShell
        title="Save your new backup codes"
        subtitle={
          isRecovery
            ? "Your authenticator was reset. Store these three new codes before you continue — they replace the old ones."
            : "Store these codes before you continue."
        }
      >
        <BackupCodesPanel codes={backupCodes} onContinue={finishAfterBackupCodes} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={title} subtitle={subtitle}>
      {loadingSetup ? (
        <p className="text-[12px] text-muted">Preparing your QR code…</p>
      ) : (
        <div className="space-y-4">
          {setup?.qrCodeDataUrl ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-elevated p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={setup.qrCodeDataUrl} alt="QR code for Google Authenticator" className="size-44 rounded-md bg-white p-2" />
              {setup.secret ? (
                <div className="w-full text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-faint">Manual entry key</p>
                  <p className="mt-1 break-all font-mono text-[11px] text-ink">{setup.secret}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-ink">Confirm with 6-digit code</label>
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
              disabled={loadingConfirm}
              className="w-full rounded-xl bg-brand py-2.5 text-[12px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
            >
              {loadingConfirm ? "Confirming…" : isRecovery ? "Confirm and sign in" : "Confirm and sign in"}
            </button>
          </form>
        </div>
      )}
    </AuthShell>
  );
}
