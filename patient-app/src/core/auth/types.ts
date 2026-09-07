export type PatientRecord = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  mobile: string;
  province: string;
  district: string;
  address: string;
  bloodGroup: string;
  hemophiliaType: string;
  deficientFactor: string;
  severity: string;
  baselineFactorLevel: string;
  photoUrl?: string;
  documents: { id?: number; name: string; url?: string; size?: number; type?: string; uploadedAt?: string }[];
  status: string;
};
