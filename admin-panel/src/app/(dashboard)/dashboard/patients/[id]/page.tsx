import PatientProfileView from "@/features/patients/components/PatientProfileView";

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PatientProfileView id={id} />;
}
