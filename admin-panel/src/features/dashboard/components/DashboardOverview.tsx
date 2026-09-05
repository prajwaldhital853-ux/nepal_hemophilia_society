const stats = [
  { label: "Total Patients", value: "—" },
  { label: "Type A (FVIII)", value: "—" },
  { label: "Type B (FIX)", value: "—" },
  { label: "Total Injections", value: "—" },
];

export default function DashboardOverview() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-slate-500">{stat.label}</p>
          <p className="mt-2 text-3xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
