import dynamic from "next/dynamic";

const InjectionsModule = dynamic(
  () => import("@/features/injections/components/InjectionsModule"),
  { loading: () => <p className="text-sm text-slate-500">Loading injections…</p> },
);

export default function InjectionsPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Injections</h1>
      <div className="mt-6">
        <InjectionsModule />
      </div>
    </section>
  );
}
