import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/patients", label: "Patients" },
  { href: "/dashboard/injections", label: "Injections" },
  { href: "/dashboard/reports", label: "Reports" },
];

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-r border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
          NHMS Admin
        </p>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="p-6">{children}</div>
    </div>
  );
}
