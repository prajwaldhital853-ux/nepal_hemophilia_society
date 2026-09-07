export type HemophiliaType = "A" | "B";
export type Severity = "Mild" | "Moderate" | "Severe";
export type InhibitorStatus = "None" | "Past" | "Current";
export type Gender = "Male" | "Female" | "Other";
export type PatientRecordStatus = "Active" | "Pending" | "Rejected";

export type PatientDocumentMeta = {
  id?: number;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt?: string;
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
};

export type PatientPayload = Omit<PatientRecord, "id" | "deficientFactor" | "createdAt" | "updatedAt"> & {
  id?: string;
  temporaryPassword?: string;
};

export function deriveFactor(type: HemophiliaType): "FVIII" | "FIX" {
  return type === "A" ? "FVIII" : "FIX";
}

export function emptyPatientForm(): PatientPayload {
  return {
    fullName: "",
    dateOfBirth: "",
    gender: "Male",
    mobile: "",
    email: "",
    province: "Bagmati",
    district: "Kathmandu",
    localLevel: "",
    wardNumber: "",
    address: "",
    bloodGroup: "O+",
    hemophiliaType: "A",
    severity: "Severe",
    baselineFactorLevel: "",
    inhibitorStatus: "None",
    diagnosisDate: "",
    primaryHospital: "Kathmandu Hemophilia Center",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    documents: [],
    notes: "",
    status: "Active",
    createdBy: "Super Admin",
    temporaryPassword: "",
  };
}
