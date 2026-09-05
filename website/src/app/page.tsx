import Link from "next/link";
import { APP_NAME } from "@/lib/config";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <p className="font-semibold text-red-600">{APP_NAME}</p>
          <nav className="flex gap-4 text-sm">
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="http://localhost:3000/login" className="font-medium text-red-600">
              Patient Login
            </Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto flex max-w-6xl flex-1 flex-col justify-center px-6 py-20">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
          Caring for Hemophilia Patients Across Nepal
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Digital platform for patient registration, treatment tracking, and
          nationwide coordination between hospitals and care centers.
        </p>
      </section>
    </main>
  );
}
