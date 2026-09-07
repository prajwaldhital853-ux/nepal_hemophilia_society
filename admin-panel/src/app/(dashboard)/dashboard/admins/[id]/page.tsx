import AdminProfileView from "@/features/admins/components/AdminProfileView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminProfileView id={id} />;
}
