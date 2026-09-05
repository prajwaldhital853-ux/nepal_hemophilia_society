import dynamic from "next/dynamic";

/** Dashboard widgets loaded as separate chunks per feature area. */
const DashboardOverview = dynamic(
  () => import("@/features/dashboard/components/DashboardOverview"),
  { loading: () => <p className="text-sm text-slate-500">Loading dashboard…</p> },
);

export default function DashboardPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        National and province-level indicators load on demand.
      </p>
      <div className="mt-6">
        <DashboardOverview />
      </div>
    </section>
  );
}
