export type HospitalStaffType = "treatment_admin" | "center_admin";

export type HospitalStaffStatus = "Active" | "Pending" | "Inactive";

export type HospitalStaffRow = {
  id: string;
  staffType: HospitalStaffType;
  fullName: string;
  name: string;
  email: string;
  phone: string;
  treatmentCenter: string;
  province: string;
  status: HospitalStaffStatus;
  joinedDate: string;
};

export type HospitalStaffProfile = HospitalStaffRow & {
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  permissions: string[];
  mustChangePassword?: boolean;
  username?: string;
  lastLogin?: string;
  roleLabel?: string;
};

export type HospitalStaffListResponse = {
  staff: HospitalStaffProfile[];
  total: number;
  page: number;
  pageSize: number;
  totalsByProvince: Record<string, number>;
};

export type HospitalOption = {
  id: number;
  name: string;
  province: string;
  district: string;
};

export const provinces = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

export const staffLabels: Record<
  HospitalStaffType,
  { title: string; singular: string; crumb: string; apiPath: string; profilePath: string }
> = {
  treatment_admin: {
    title: "All Treatment Admins",
    singular: "Treatment Admin",
    crumb: "Treatment Admin",
    apiPath: "/hospitals/staff/treatment-admins/",
    profilePath: "/dashboard/hospitals/treatment-admins",
  },
  center_admin: {
    title: "All Center Admins",
    singular: "Center Admin",
    crumb: "Center Admin",
    apiPath: "/hospitals/staff/center-admins/",
    profilePath: "/dashboard/hospitals/center-admins",
  },
};

export function toStaffRow(item: HospitalStaffProfile): HospitalStaffRow {
  return {
    id: item.id,
    staffType: item.staffType,
    fullName: item.fullName,
    name: item.fullName,
    email: item.email,
    phone: item.phone,
    treatmentCenter: item.treatmentCenter,
    province: item.province,
    status: item.status,
    joinedDate: item.joinedDate,
  };
}
