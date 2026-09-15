"use client";

import StaffAccountForm from "@/features/admins/components/StaffAccountForm";
import type { HospitalStaffType } from "@/features/hospitals/types";

type Props = {
  staffType: HospitalStaffType;
  onClose: () => void;
  onCreated: () => void;
};

export default function HospitalStaffFormDialog({ staffType, onClose, onCreated }: Props) {
  return <StaffAccountForm lockedKind={staffType} onClose={onClose} onSaved={onCreated} />;
}
