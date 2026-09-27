"use client";

import { useState } from "react";
import { Copy, ShieldAlert } from "lucide-react";

import { copyText } from "@/components/ui/ActionsMenu";

type BackupCodesPanelProps = {
  codes: string[];
  onContinue: () => void;
};

export function BackupCodesPanel({ codes, onContinue }: BackupCodesPanelProps) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" />
          <div>
            <p className="text-[12px] font-semibold text-amber-900 dark:text-amber-200">Save your backup codes now</p>
            <p className="mt-1 text-[11px] leading-5 text-amber-800 dark:text-amber-300/90">
              These three codes are shown only once. Store them in a password manager or print and lock them away. Any one
              code can reset your authenticator if you lose your phone.
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {codes.map((code) => (
          <li
            key={code}
            className="flex items-center justify-between rounded-xl border border-line bg-elevated px-3 py-2.5 font-mono text-[14px] tracking-wide text-ink"
          >
            <span>{code}</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
              onClick={() => void copyText(code)}
            >
              <Copy className="size-3.5" />
              Copy
            </button>
          </li>
        ))}
      </ul>

      <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-line-subtle px-3 py-2.5">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
          className="mt-0.5 size-3.5 rounded border border-line accent-brand"
        />
        <span className="text-[11px] leading-5 text-ink">
          I have saved these backup codes in a safe place. I understand they will not be shown again.
        </span>
      </label>

      <button
        type="button"
        disabled={!saved}
        onClick={onContinue}
        className="w-full rounded-xl bg-brand py-2.5 text-[12px] font-semibold text-white hover:bg-brand-blueDark disabled:opacity-60"
      >
        Continue to admin panel
      </button>
    </div>
  );
}
