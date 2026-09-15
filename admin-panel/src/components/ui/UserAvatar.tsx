"use client";

import { useRef, useState } from "react";

import { apiForm, resolveMediaUrl } from "@/lib/api";
import { type AuthUser, useAuth } from "@/lib/auth";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserAvatar({
  name,
  photoUrl,
  size = 28,
  className = "",
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const src = resolveMediaUrl(photoUrl);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={size} height={size} className={`rounded-full object-cover ${className}`} />;
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function OwnAvatar({
  name,
  photoUrl,
  size = 28,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const { setSession } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append("photo", file);
      const data = await apiForm("/auth/me/", body, "PATCH");
      setSession(data as AuthUser);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not update photo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        title="Change profile photo"
        className="relative shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <UserAvatar name={name} photoUrl={photoUrl} size={size} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        className="sr-only"
        onChange={(event) => void onChange(event)}
      />
    </>
  );
}
