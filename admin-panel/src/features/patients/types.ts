export type HemophiliaType = "A" | "B";
export type Severity = "Mild" | "Moderate" | "Severe";
export type InhibitorStatus = "None" | "Past" | "Current";
export type TreatmentPlan =
  | "Regular Prophylaxis"
  | "On-demand"
  | "ITI"
  | "Bypassing / Specialist"
  | "Other";
export type Gender = "Male" | "Female" | "Other";
export type PatientRecordStatus = "Active" | "Pending" | "Rejected";

export type PatientRow = {
  id: string;
  name: string;
  province: string;
  center: string;
  bloodGroup: string;
  age: number;
  lastVisit: string;
  status: PatientRecordStatus;
  canEdit?: boolean;
  canDelete?: boolean;
};

export type PatientDocumentMeta = {
  id?: number;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  uploadedByRole?: string;
  hospitalName?: string;
  center?: string;
};

export type PatientRecord = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  mobile: string;
  email: string;
  province: string;
  district: string;
  localLevel: string;
  wardNumber: string;
  address: string;
  bloodGroup: string;
  hemophiliaType: HemophiliaType;
  deficientFactor: "FVIII" | "FIX";
  severity: Severity;
  baselineFactorLevel: string;
  inhibitorStatus: InhibitorStatus;
  treatmentPlan: TreatmentPlan;
  prescribedFactorMedicineId?: number | null;
  prescribedFactorMedicineName?: string;
  diagnosisDate: string;
  primaryHospital: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  documents: PatientDocumentMeta[];
  notes: string;
  status: PatientRecordStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  photoUrl?: string;
  mustChangePassword?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

export type PatientPayload = Omit<PatientRecord, "id" | "deficientFactor" | "createdAt" | "updatedAt"> & {
  id?: string;
  temporaryPassword?: string;
};

export function deriveFactor(type: HemophiliaType): "FVIII" | "FIX" {
  return type === "A" ? "FVIII" : "FIX";
}

/** Ensures every form field is a defined value so React inputs stay controlled. */
export function normalizePatientForm(source?: Partial<PatientRecord> | null): PatientPayload {
  const defaults = emptyPatientForm();
  if (!source) return defaults;

  return {
    ...defaults,
    ...source,
    fullName: source.fullName ?? "",
    dateOfBirth: source.dateOfBirth ?? "",
    gender: source.gender ?? defaults.gender,
    mobile: source.mobile ?? "",
    email: source.email ?? "",
    province: source.province ?? "",
    district: source.district ?? "",
    localLevel: source.localLevel ?? "",
    wardNumber: source.wardNumber ?? "",
    address: source.address ?? "",
    bloodGroup: source.bloodGroup ?? "",
    hemophiliaType: source.hemophiliaType ?? defaults.hemophiliaType,
    severity: source.severity ?? defaults.severity,
    baselineFactorLevel: source.baselineFactorLevel ?? "",
    inhibitorStatus: source.inhibitorStatus ?? defaults.inhibitorStatus,
    treatmentPlan: source.treatmentPlan ?? defaults.treatmentPlan,
    prescribedFactorMedicineId: source.prescribedFactorMedicineId ?? null,
    diagnosisDate: source.diagnosisDate ?? "",
    primaryHospital: source.primaryHospital ?? "",
    emergencyContactName: source.emergencyContactName ?? "",
    emergencyContactPhone: source.emergencyContactPhone ?? "",
    emergencyContactRelation: source.emergencyContactRelation ?? "",
    documents: source.documents ?? [],
    notes: source.notes ?? "",
    status: source.status ?? defaults.status,
    createdBy: source.createdBy ?? "",
    temporaryPassword: "",
  };
}

export function emptyPatientForm(): PatientPayload {
  return {
    fullName: "",
    dateOfBirth: "",
    gender: "Male",
    mobile: "",
    email: "",
    province: "",
    district: "",
    localLevel: "",
    wardNumber: "",
    address: "",
    bloodGroup: "",
    hemophiliaType: "A",
    severity: "Severe",
    baselineFactorLevel: "",
    inhibitorStatus: "None",
    treatmentPlan: "Regular Prophylaxis",
    prescribedFactorMedicineId: null,
    diagnosisDate: "",
    primaryHospital: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    documents: [],
    notes: "",
    status: "Active",
    createdBy: "",
    temporaryPassword: "",
  };
}
