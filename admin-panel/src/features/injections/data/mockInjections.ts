export type InjectionType = "Prophylaxis" | "On-Demand" | "Emergency";
export type InjectionStatus = "Completed" | "Scheduled" | "Pending" | "Cancelled";

export type InjectionRecord = {
  id: string;
  patientId: string;
  patientName: string;
  factorType: string;
  dose: string;
  type: InjectionType;
  date: string;
  time: string;
  location: string;
  administeredBy: string;
  status: InjectionStatus;
  notes?: string;
};

export const allInjections: InjectionRecord[] = [
  {
    id: "INJ-2025-1543",
    patientId: "HEM-0008742",
    patientName: "Aarav Shrestha",
    factorType: "Factor VIII",
    dose: "2500 IU",
    type: "Prophylaxis",
    date: "May 16, 2025",
    time: "10:30 AM",
    location: "Kathmandu Hemophilia Center",
    administeredBy: "Dr. Ravi Shrestha",
    status: "Completed",
  },
  {
    id: "INJ-2025-1542",
    patientId: "HEM-0008741",
    patientName: "Sita Magar",
    factorType: "Factor IX",
    dose: "1800 IU",
    type: "On-Demand",
    date: "May 16, 2025",
    time: "09:15 AM",
    location: "Pokhara Hemophilia Center",
    administeredBy: "Dr. Priya Gurung",
    status: "Completed",
  },
  {
    id: "INJ-2025-1541",
    patientId: "HEM-0008740",
    patientName: "Bikash Tamang",
    factorType: "Factor VIII",
    dose: "3000 IU",
    type: "Prophylaxis",
    date: "May 17, 2025",
    time: "02:00 PM",
    location: "Biratnagar Hemophilia Center",
    administeredBy: "Dr. Bikash Tamang",
    status: "Scheduled",
  },
  {
    id: "INJ-2025-1540",
    patientId: "HEM-0008739",
    patientName: "Anjali KC",
    factorType: "Emicizumab",
    dose: "105 mg",
    type: "Prophylaxis",
    date: "May 16, 2025",
    time: "11:45 AM",
    location: "Bhaktapur Treatment Center",
    administeredBy: "Dr. Anjali KC",
    status: "Completed",
  },
  {
    id: "INJ-2025-1539",
    patientId: "HEM-0008738",
    patientName: "Nabin Rai",
    factorType: "Factor VIIa",
    dose: "90 mcg/kg",
    type: "Emergency",
    date: "May 15, 2025",
    time: "11:30 PM",
    location: "Janakpur Hemophilia Clinic",
    administeredBy: "Dr. Emergency Team",
    status: "Completed",
    notes: "Severe bleeding episode",
  },
  {
    id: "INJ-2025-1538",
    patientId: "HEM-0008737",
    patientName: "Kiran Thapa",
    factorType: "Factor VIII",
    dose: "2000 IU",
    type: "On-Demand",
    date: "May 18, 2025",
    time: "10:00 AM",
    location: "Kathmandu Hemophilia Center",
    administeredBy: "Dr. Ravi Shrestha",
    status: "Scheduled",
  },
  {
    id: "INJ-2025-1537",
    patientId: "HEM-0008736",
    patientName: "Maya Limbu",
    factorType: "Factor IX",
    dose: "2200 IU",
    type: "Prophylaxis",
    date: "May 15, 2025",
    time: "03:15 PM",
    location: "Butwal Treatment Center",
    administeredBy: "Dr. Maya Limbu",
    status: "Completed",
  },
  {
    id: "INJ-2025-1536",
    patientId: "HEM-0008735",
    patientName: "Suresh Bhandari",
    factorType: "Factor VIII",
    dose: "2800 IU",
    type: "Prophylaxis",
    date: "May 19, 2025",
    time: "09:30 AM",
    location: "Hetauda Hemophilia Center",
    administeredBy: "Dr. Suresh Bhandari",
    status: "Pending",
  },
];

export const injectionStats = {
  totalInjections: 1543,
  thisMonth: 412,
  prophylaxis: 298,
  onDemand: 89,
  emergency: 25,
  scheduled: 48,
};

export const monthlyInjections = [
  { month: "Jan", prophylaxis: 285, onDemand: 78, emergency: 22 },
  { month: "Feb", prophylaxis: 295, onDemand: 82, emergency: 19 },
  { month: "Mar", prophylaxis: 312, onDemand: 91, emergency: 24 },
  { month: "Apr", prophylaxis: 305, onDemand: 85, emergency: 23 },
  { month: "May", prophylaxis: 298, onDemand: 89, emergency: 25 },
];

export const factorUsage = [
  { name: "Factor VIII", value: 852, color: "#2F6FED" },
  { name: "Factor IX", value: 428, color: "#22C55E" },
  { name: "Emicizumab", value: 156, color: "#F59E0B" },
  { name: "Factor VIIa", value: 107, color: "#EF4444" },
];

export const injectionsByCenter = [
  { center: "Kathmandu HC", count: 428 },
  { center: "Pokhara HC", count: 286 },
  { center: "Biratnagar HC", count: 195 },
  { center: "Bhaktapur TC", count: 178 },
  { center: "Others", count: 456 },
];
