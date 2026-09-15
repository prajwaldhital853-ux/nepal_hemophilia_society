import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page p-6 text-center">
      <h1 className="text-[18px] font-semibold text-ink">Page not found</h1>
      <p className="text-[12px] text-muted">The page you requested does not exist or was moved.</p>
      <Link href="/dashboard" className="rounded bg-brand px-3 py-1.5 text-[12px] font-semibold text-white">
        Back to dashboard
      </Link>
    </main>
  );
}
