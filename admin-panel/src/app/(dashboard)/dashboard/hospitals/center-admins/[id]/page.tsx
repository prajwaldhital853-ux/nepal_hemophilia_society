import HospitalStaffProfileView from "@/features/hospitals/components/HospitalStaffProfileView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <HospitalStaffProfileView id={id} staffType="center_admin" />;
}
