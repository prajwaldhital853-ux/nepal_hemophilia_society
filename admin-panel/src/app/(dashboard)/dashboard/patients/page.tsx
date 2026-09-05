import dynamic from "next/dynamic";

const PatientsModule = dynamic(
  () => import("@/features/patients/components/PatientsModule"),
  { loading: () => <p className="text-sm text-slate-500">Loading patients…</p> },
);

export default function PatientsPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Patients</h1>
      <div className="mt-6">
        <PatientsModule />
      </div>
    </section>
  );
}
