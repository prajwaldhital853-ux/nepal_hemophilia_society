import { NextResponse } from "next/server";

import { getPatient, updatePatient } from "@/features/patients/server/patientStore";
import type { PatientPayload } from "@/features/patients/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  return NextResponse.json({ patient });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const payload = (await request.json()) as PatientPayload;
    const patient = await updatePatient(id, payload);
    return NextResponse.json({ patient });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update patient";
    const status = message === "Patient not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
