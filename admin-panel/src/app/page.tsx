import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-red-600">
          Nepal Hemophilia Society
        </p>
        <h1 className="mt-2 text-4xl font-bold">{APP_NAME}</h1>
        <p className="mt-3 max-w-xl text-slate-600">
          Admin dashboard scaffold is ready. Feature modules load on demand via
          code splitting.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Admin Login
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium hover:bg-white"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
