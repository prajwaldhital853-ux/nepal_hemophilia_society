import { NextResponse } from "next/server";

import { createPatient, readPatients } from "@/features/patients/server/patientStore";
import type { PatientPayload } from "@/features/patients/types";

export async function GET() {
  const rows = await readPatients();
  return NextResponse.json({ patients: rows });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as PatientPayload;
    const patient = await createPatient(payload);
    return NextResponse.json({ patient }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create patient";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
