export const provinces = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
];

export const treatmentCenters = [
  "Kathmandu Hemophilia Center",
  "TU Teaching Hospital",
  "Pokhara Hemophilia Clinic",
  "Biratnagar Treatment Center",
  "NHS Central Store",
];

export type PatientRow = {
  id: string;
  name: string;
  province: string;
  center: string;
  bloodGroup: string;
  age: number;
  lastVisit: string;
  status: "Active" | "Pending" | "Rejected";
};

export const allPatients: PatientRow[] = [
  {
    id: "HEM-0012345",
    name: "Ravi Shrestha",
    province: "Bagmati",
    center: "Kathmandu Hemophilia Center",
    bloodGroup: "O+",
    age: 24,
    lastVisit: "May 16, 2025",
    status: "Active",
  },
  {
    id: "HEM-0008742",
    name: "Aarav Shrestha",
    province: "Bagmati",
    center: "TU Teaching Hospital",
    bloodGroup: "A+",
    age: 18,
    lastVisit: "May 16, 2025",
    status: "Active",
  },
  {
    id: "HEM-0008741",
    name: "Sita Magar",
    province: "Gandaki",
    center: "Pokhara Hemophilia Clinic",
    bloodGroup: "B+",
    age: 22,
    lastVisit: "May 14, 2025",
    status: "Pending",
  },
  {
    id: "HEM-0008740",
    name: "Bikash Tamang",
    province: "Koshi",
    center: "Biratnagar Treatment Center",
    bloodGroup: "O+",
    age: 31,
    lastVisit: "May 12, 2025",
    status: "Active",
  },
  {
    id: "HEM-0008739",
    name: "Anjali KC",
    province: "Lumbini",
    center: "NHS Central Store",
    bloodGroup: "AB+",
    age: 27,
    lastVisit: "May 11, 2025",
    status: "Active",
  },
  {
    id: "HEM-0008738",
    name: "Nabin Rai",
    province: "Madhesh",
    center: "TU Teaching Hospital",
    bloodGroup: "A-",
    age: 16,
    lastVisit: "May 10, 2025",
    status: "Pending",
  },
  {
    id: "HEM-0008720",
    name: "Manish Sapkota",
    province: "Bagmati",
    center: "Kathmandu Hemophilia Center",
    bloodGroup: "O+",
    age: 12,
    lastVisit: "May 09, 2025",
    status: "Active",
  },
  {
    id: "HEM-0008601",
    name: "Prakash Gurung",
    province: "Gandaki",
    center: "Pokhara Hemophilia Clinic",
    bloodGroup: "B+",
    age: 29,
    lastVisit: "May 08, 2025",
    status: "Active",
  },
];

export const patientTotals: Record<string, number> = {
  All: 8742,
  Koshi: 1842,
  Madhesh: 1256,
  Bagmati: 2102,
  Gandaki: 986,
  Lumbini: 1124,
  Karnali: 654,
  Sudurpashchim: 778,
};

export const patientProfile = {
  id: "HEM-0012345",
  name: "Ravi Shrestha",
  status: "Active",
  gender: "Male",
  age: 24,
  bloodGroup: "O+",
  location: "Kathmandu, Bagmati",
  registered: "May 10, 2023",
  lastVisit: "May 16, 2025",
  personal: {
    dob: "12 March 2001",
    gender: "Male",
    phone: "+977-9801234567",
    email: "ravi.shrestha@email.com",
    nationality: "Nepali",
    address: "Baneshwor, Kathmandu, Bagmati Province",
  },
  diagnosis: {
    diagnosis: "Hemophilia A (Severe)",
    factorLevel: "<1%",
    plan: "Regular Prophylaxis",
    factor: "Factor VIII",
    nextAppointment: "30 May 2025",
  },
  injections: [
    { date: "16 May 2025", factor: "Factor VIII", dose: "1,500 IU", doctor: "Dr. Sharma" },
    { date: "02 May 2025", factor: "Factor VIII", dose: "1,500 IU", doctor: "Dr. Sharma" },
    { date: "18 Apr 2025", factor: "Factor VIII", dose: "1,000 IU", doctor: "Dr. Adhikari" },
  ],
  documents: [
    { name: "Registration Form.pdf", date: "10 May 2023" },
    { name: "Lab Report.pdf", date: "16 May 2025" },
    { name: "Consent Form.pdf", date: "10 May 2023" },
  ],
};
