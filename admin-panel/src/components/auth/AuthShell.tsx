"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

function BrandMark() {
  return (
    <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left lg:items-center">
      <Image
        src="/nhs-logo.png"
        alt="Nepal Hemophilia Society"
        width={72}
        height={96}
        className="h-[72px] w-[52px] object-contain sm:h-20 sm:w-[72px]"
        priority
        quality={100}
        unoptimized
      />
      <div className="max-w-[280px] sm:max-w-[240px] lg:max-w-[280px]">
        <p className="text-[11px] font-extrabold uppercase leading-4 tracking-[0.14em] text-brand sm:text-[10px] sm:tracking-[0.18em]">
          Nepal Hemophilia Society
        </p>
        <p className="mt-1 text-sm font-bold leading-5 text-ink sm:text-[13px] lg:text-[14px]">
          Digital Management System
        </p>
        <p className="mt-1.5 text-[11px] font-medium text-muted lg:hidden">Protected admin workspace</p>
      </div>
    </div>
  );
}

export function AuthShell({ title, subtitle, children, footer, backHref, backLabel }: AuthShellProps) {
  return (
    <main className="relative flex min-h-[100dvh] w-full bg-page">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(185,28,28,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(30,58,138,0.12),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-20 size-72 rounded-full bg-brand/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-10 size-80 rounded-full bg-brand-blueDark/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:py-12">
        {/* Mobile: brand on top. Desktop: brand on the left. */}
        <section className="mb-6 w-full max-w-[420px] shrink-0 lg:mb-0 lg:max-w-md lg:flex-1">
          <div className="flex justify-center lg:justify-start">
            <BrandMark />
          </div>

          <h1 className="mt-6 hidden text-center text-[26px] font-bold leading-tight text-ink lg:block lg:text-left lg:text-[30px]">
            Secure admin access for hemophilia care coordination
          </h1>
          <p className="mt-3 hidden max-w-md text-center text-[13px] leading-6 text-muted lg:block lg:text-left">
            Manage patients, treatment centers, stock, appointments, and national reporting from one protected
            workspace.
          </p>
        </section>

        <section className="w-full max-w-[420px] shrink-0 lg:max-w-[400px]">
          <div className="overflow-hidden rounded-2xl border border-line/80 bg-card/95 shadow-xl backdrop-blur-sm">
            <div className="border-b border-line-subtle bg-gradient-to-r from-brand/8 via-transparent to-brand-blueDark/8 px-5 py-5 sm:px-6">
              {backHref ? (
                <Link
                  href={backHref}
                  className="mb-3 inline-block text-xs font-semibold text-brand hover:underline sm:text-[11px]"
                >
                  ← {backLabel || "Back"}
                </Link>
              ) : null}
              <h2 className="text-lg font-semibold text-ink sm:text-[18px]">{title}</h2>
              {subtitle ? <p className="mt-1.5 text-xs leading-5 text-muted sm:text-[11px]">{subtitle}</p> : null}
            </div>
            <div className="auth-shell-body px-5 py-5 sm:px-6 sm:py-5">{children}</div>
            {footer ? <div className="border-t border-line-subtle px-5 py-4 text-center sm:px-6">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
