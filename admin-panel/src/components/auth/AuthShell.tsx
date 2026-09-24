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

export function AuthShell({ title, subtitle, children, footer, backHref, backLabel }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-page">
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

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-stretch gap-4 p-4 py-6 sm:gap-6 sm:p-6 lg:flex-row lg:items-center lg:gap-10 lg:py-12">
        <section className="order-1 w-full max-w-md flex-shrink-0 lg:order-2 lg:max-w-[400px]">
          <div className="overflow-hidden rounded-2xl border border-line/80 bg-card/95 shadow-xl backdrop-blur-sm">
            <div className="border-b border-line-subtle bg-gradient-to-r from-brand/8 via-transparent to-brand-blueDark/8 px-6 py-5">
              {backHref ? (
                <Link href={backHref} className="mb-3 inline-block text-[11px] font-semibold text-brand hover:underline">
                  ← {backLabel || "Back"}
                </Link>
              ) : null}
              <h2 className="text-[18px] font-semibold text-ink">{title}</h2>
              {subtitle ? <p className="mt-1 text-[11px] leading-5 text-muted">{subtitle}</p> : null}
            </div>
            <div className="px-6 py-5">{children}</div>
            {footer ? <div className="border-t border-line-subtle px-6 py-4 text-center">{footer}</div> : null}
          </div>
        </section>

        <section className="order-2 flex flex-col items-center text-center lg:order-1 lg:flex-1 lg:items-start lg:text-left">
          <div className="flex items-center gap-3">
            <Image
              src="/nhs-logo.png"
              alt="Nepal Hemophilia Society"
              width={72}
              height={96}
              className="h-14 w-[50px] object-contain sm:h-20 sm:w-[72px]"
              priority
              quality={100}
              unoptimized
            />
            <div className="text-left">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">Nepal Hemophilia Society</p>
              <p className="mt-0.5 max-w-[220px] text-[11px] font-bold leading-4 text-ink">
                Digital Management System
              </p>
            </div>
          </div>

          <h1 className="mt-4 hidden text-[26px] font-bold leading-tight text-ink sm:mt-6 sm:block sm:text-[30px] lg:block">
            Secure admin access for hemophilia care coordination
          </h1>
          <p className="mt-2 hidden max-w-md text-[13px] leading-6 text-muted sm:mt-3 sm:block">
            Manage patients, treatment centers, stock, appointments, and national reporting from one protected workspace.
          </p>
          <p className="mt-3 text-[12px] font-medium text-muted sm:hidden">Protected admin workspace</p>
        </section>
      </div>
    </main>
  );
}
