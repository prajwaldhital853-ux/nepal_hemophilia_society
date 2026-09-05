"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

/** Dynamically loaded modal — code fetched only when opened. */
const HelpModal = dynamic(() => import("@/components/modals/HelpModal"), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="rounded-lg bg-white px-6 py-4 text-sm">Loading…</div>
    </div>
  ),
  ssr: false,
});

export default function LoginPage() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in with your hospital, province, or super admin credentials.
        </p>
        <form className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="admin@nhms.org"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="••••••••"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Sign In
          </button>
        </form>
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="mt-4 text-sm text-red-600 hover:underline"
        >
          Need help signing in?
        </button>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </main>
  );
}
