import dynamic from "next/dynamic";

const ReportsModule = dynamic(
  () => import("@/features/reports/components/ReportsModule"),
  { loading: () => <p className="text-sm text-slate-500">Loading reports…</p> },
);

export default function ReportsPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="mt-6">
        <ReportsModule />
      </div>
    </section>
  );
}
