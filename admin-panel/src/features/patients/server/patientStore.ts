import { promises as fs } from "fs";
import path from "path";

import { deriveFactor, type PatientPayload, type PatientRecord } from "@/features/patients/types";

const filePath = path.join(process.cwd(), "data", "patients.json");

async function ensureFile() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf8");
  }
}

export async function readPatients(): Promise<PatientRecord[]> {
  await ensureFile();
  const raw = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(raw) as PatientRecord[];
  } catch {
    return [];
  }
}

async function writePatients(rows: PatientRecord[]) {
  await ensureFile();
  await fs.writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
}

function nextId(rows: PatientRecord[]) {
  const nums = rows
    .map((row) => Number(String(row.id).replace(/\D/g, "")))
    .filter((n) => Number.isFinite(n));
  const next = Math.max(8743, ...nums, 0) + 1;
  return `HEM-${String(next).padStart(7, "0")}`;
}

function validate(payload: PatientPayload) {
  const required: Array<keyof PatientPayload> = [
    "fullName",
    "dateOfBirth",
    "gender",
    "mobile",
    "province",
    "district",
    "localLevel",
    "wardNumber",
    "address",
    "bloodGroup",
    "hemophiliaType",
    "severity",
    "baselineFactorLevel",
    "primaryHospital",
    "emergencyContactName",
    "emergencyContactPhone",
  ];
  for (const key of required) {
    if (!String(payload[key] ?? "").trim()) {
      throw new Error(`${String(key)} is required`);
    }
  }
  if (!/^(97|98)\d{8}$/.test(payload.mobile.replace(/\s/g, "").replace(/^\+977/, ""))) {
    throw new Error("Enter a valid Nepal mobile number (98/97 + 8 digits)");
  }
}

export async function createPatient(payload: PatientPayload): Promise<PatientRecord> {
  validate(payload);
  const rows = await readPatients();
  const now = new Date().toISOString();
  const record: PatientRecord = {
    ...payload,
    id: nextId(rows),
    deficientFactor: deriveFactor(payload.hemophiliaType),
    fullName: payload.fullName.trim(),
    createdAt: now,
    updatedAt: now,
  };
  rows.unshift(record);
  await writePatients(rows);
  return record;
}

export async function updatePatient(id: string, payload: PatientPayload): Promise<PatientRecord> {
  validate(payload);
  const rows = await readPatients();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) throw new Error("Patient not found");
  const now = new Date().toISOString();
  const record: PatientRecord = {
    ...rows[index],
    ...payload,
    id,
    deficientFactor: deriveFactor(payload.hemophiliaType),
    fullName: payload.fullName.trim(),
    updatedAt: now,
  };
  rows[index] = record;
  await writePatients(rows);
  return record;
}

export async function getPatient(id: string) {
  const rows = await readPatients();
  return rows.find((row) => row.id === id) ?? null;
}
