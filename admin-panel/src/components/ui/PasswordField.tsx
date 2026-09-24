"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
};

export function PasswordField({
  value,
  onChange,
  label,
  autoComplete,
  disabled,
  required,
  minLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-ink">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-line bg-elevated py-1.5 pl-2.5 pr-9 text-[11px] text-ink outline-none"
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          minLength={minLength}
        />
        <button
          type="button"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          disabled={disabled}
        >
          {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}
