"use client";

import StaffAccountForm from "@/features/admins/components/StaffAccountForm";

type Props = {
  takenProvinces: string[];
  onClose: () => void;
  onCreated: () => void;
};

export default function AdminFormDialog({ takenProvinces, onClose, onCreated }: Props) {
  return <StaffAccountForm takenProvinces={takenProvinces} onClose={onClose} onSaved={onCreated} />;
}
