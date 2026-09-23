import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";

import { patientApi } from "@/core/api";
import { useAuth } from "@/core/auth/AuthContext";
import type { RootStackParamList } from "@/core/navigation/types";

const C = {
  bg: "#F5F6F8",
  card: "#FFFFFF",
  border: "#E2E5EA",
  navy: "#001D3D",
  red: "#C1121F",
  text: "#1F2937",
  muted: "#6B7280",
  faint: "#9CA3AF",
  greenBg: "#ECFDF5",
  green: "#047857",
  redBg: "#FEF2F2",
  blueBg: "#EFF6FF",
  blue: "#1D4ED8",
  grayBg: "#F3F4F6",
};

type Appointment = {
  id: number;
  hospitalName: string;
  province: string;
  visitType: string;
  visitTypeLabel: string;
  reason: string;
  preferredAt: string;
  scheduledAt?: string | null;
  doctorName?: string;
  status: string;
  statusLabel: string;
  adminNote?: string;
  handledBy?: string;
};

type Center = { id: number; name: string; province: string };
type Slot = { id: number; hospitalId: number; slotAt: string };

const VISIT_TYPES = [
  { id: "clinic_review", label: "Clinic review", hint: "Routine haematology visit" },
  { id: "prophylaxis", label: "Prophylaxis", hint: "Plan or review regular treatment" },
  { id: "bleed_followup", label: "Bleed follow-up", hint: "After a joint or muscle bleed" },
  { id: "physiotherapy", label: "Physiotherapy", hint: "Joint movement and strength" },
  { id: "dental", label: "Dental planning", hint: "Before a dental procedure" },
  { id: "counselling", label: "Counselling", hint: "Family or youth support" },
];

const STEP_TITLES = ["Type of visit", "Treatment centre", "Date and time", "Reason"];

type Props = StackScreenProps<RootStackParamList, "Appointments">;

function formatWhen(iso?: string | null) {
  if (!iso) return "Not set yet";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function statusTone(status: string) {
  if (status === "confirmed" || status === "completed") return { bg: C.greenBg, fg: C.green };
  if (status === "declined" || status === "cancelled") return { bg: C.redBg, fg: C.red };
  if (status === "rescheduled") return { bg: C.blueBg, fg: C.blue };
  return { bg: C.grayBg, fg: C.muted };
}

export default function AppointmentsScreen({ route }: Props) {
  const { token } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(0);
  const [visitType, setVisitType] = useState("clinic_review");
  const [hospitalId, setHospitalId] = useState<number | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(route.params?.appointmentId ?? null);

  const load = useCallback(async () => {
    if (!token) return;
    setError("");
    try {
      const [mine, centreData] = await Promise.all([
        patientApi("/me/patient/appointments/", { token }),
        patientApi("/cms/centers/", { token }),
      ]);
      setItems(Array.isArray(mine.appointments) ? mine.appointments : []);
      const rows = Array.isArray(centreData.centers) ? centreData.centers : [];
      setCenters(rows);
      setHospitalId((current) => current ?? rows[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load appointments");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  // Available times published by the selected centre.
  useEffect(() => {
    if (!token || !hospitalId) return;
    setSlotId(null);
    patientApi(`/me/patient/appointment-slots/?hospitalId=${hospitalId}`, { token })
      .then((data) => setSlots(Array.isArray(data.slots) ? data.slots : []))
      .catch(() => setSlots([]));
  }, [hospitalId, token]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const day = new Date(slot.slotAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
      map.set(day, [...(map.get(day) || []), slot]);
    }
    return Array.from(map.entries());
  }, [slots]);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const chosenSlot = slots.find((slot) => slot.id === slotId) ?? null;

  const canContinue =
    step === 0 ? Boolean(visitType) : step === 1 ? Boolean(hospitalId) : step === 2 ? Boolean(chosenSlot) : reason.trim().length >= 4;

  async function submit() {
    if (!token || !hospitalId || !chosenSlot) return;
    setSaving(true);
    setError("");
    try {
      const data = await patientApi("/me/patient/appointments/", {
        method: "POST",
        token,
        body: JSON.stringify({
          visitType,
          hospitalId,
          preferredAt: chosenSlot.slotAt,
          reason,
        }),
      });
      setBooking(false);
      setStep(0);
      setReason("");
      setSlotId(null);
      setSelectedId(data.appointment?.id ?? null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the request");
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id: number) {
    if (!token) return;
    await patientApi(`/me/patient/appointments/${id}/`, {
      method: "POST",
      token,
      body: JSON.stringify({ action: "cancel" }),
    });
    await load();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Appointments</Text>
          <Text style={styles.subtitle}>Request a visit and track the centre&apos;s reply.</Text>
        </View>
        {!booking ? (
          <Pressable
            style={styles.newBtn}
            onPress={() => {
              setBooking(true);
              setSelectedId(null);
              setStep(0);
            }}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.newBtnText}>New request</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color={C.red} style={{ marginVertical: 12 }} /> : null}

      {/* Booking form */}
      {booking ? (
        <View style={styles.card}>
          {/* Step header */}
          <View style={styles.stepsRow}>
            {STEP_TITLES.map((label, index) => (
              <View key={label} style={styles.stepItem}>
                <View style={[styles.stepDot, index === step && styles.stepDotActive, index < step && styles.stepDotDone]}>
                  {index < step ? (
                    <Ionicons name="checkmark" size={11} color="#fff" />
                  ) : (
                    <Text style={[styles.stepNum, index === step && styles.stepNumActive]}>{index + 1}</Text>
                  )}
                </View>
                {index < STEP_TITLES.length - 1 ? <View style={[styles.stepLine, index < step && styles.stepLineDone]} /> : null}
              </View>
            ))}
          </View>
          <Text style={styles.stepTitle}>{STEP_TITLES[step]}</Text>

          {step === 0 ? (
            <View style={styles.optionList}>
              {VISIT_TYPES.map((type) => (
                <Pressable key={type.id} style={styles.optionRow} onPress={() => setVisitType(type.id)}>
                  <View style={[styles.radio, visitType === type.id && styles.radioOn]}>
                    {visitType === type.id ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={styles.optionBody}>
                    <Text style={styles.optionTitle}>{type.label}</Text>
                    <Text style={styles.optionHint}>{type.hint}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.optionList}>
              {centers.map((center) => (
                <Pressable key={center.id} style={styles.optionRow} onPress={() => setHospitalId(center.id)}>
                  <View style={[styles.radio, hospitalId === center.id && styles.radioOn]}>
                    {hospitalId === center.id ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={styles.optionBody}>
                    <Text style={styles.optionTitle}>{center.name}</Text>
                    <Text style={styles.optionHint}>{center.province}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {step === 2 ? (
            slotsByDay.length === 0 ? (
              <View style={styles.emptySlots}>
                <Ionicons name="time-outline" size={22} color={C.faint} />
                <Text style={styles.emptySlotsText}>
                  This centre has not published visit times yet. Try another centre, or check back later — the centre team adds
                  available dates from their side.
                </Text>
              </View>
            ) : (
              <View>
                {slotsByDay.map(([day, daySlots]) => (
                  <View key={day} style={styles.dayBlock}>
                    <Text style={styles.dayLabel}>{day}</Text>
                    <View style={styles.timeWrap}>
                      {daySlots.map((slot) => {
                        const label = new Date(slot.slotAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                        const active = slotId === slot.id;
                        return (
                          <Pressable key={slot.id} style={[styles.timeBox, active && styles.timeBoxOn]} onPress={() => setSlotId(slot.id)}>
                            <Text style={[styles.timeText, active && styles.timeTextOn]}>{label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )
          ) : null}

          {step === 3 ? (
            <View>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Example: left knee still swollen after Friday's bleed"
                placeholderTextColor={C.faint}
                multiline
                style={styles.input}
              />
              <View style={styles.summary}>
                <SummaryRow label="Visit" value={VISIT_TYPES.find((t) => t.id === visitType)?.label || ""} />
                <SummaryRow label="Centre" value={centers.find((c) => c.id === hospitalId)?.name || ""} />
                <SummaryRow label="Time" value={chosenSlot ? formatWhen(chosenSlot.slotAt) : ""} />
              </View>
            </View>
          ) : null}

          {/* Footer buttons */}
          <View style={styles.footerRow}>
            <Pressable
              style={styles.backBtn}
              onPress={() => (step > 0 ? setStep((value) => value - 1) : setBooking(false))}
            >
              <Text style={styles.backText}>{step > 0 ? "Back" : "Cancel"}</Text>
            </Pressable>
            {step < 3 ? (
              <Pressable
                style={[styles.nextBtn, !canContinue && styles.btnDisabled]}
                disabled={!canContinue}
                onPress={() => setStep((value) => value + 1)}
              >
                <Text style={styles.nextText}>Continue</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.nextBtn, (!canContinue || saving) && styles.btnDisabled]}
                disabled={!canContinue || saving}
                onPress={() => void submit()}
              >
                <Text style={styles.nextText}>{saving ? "Sending…" : "Send request"}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}

      {/* Selected appointment detail */}
      {selected ? (
        <View style={styles.card}>
          <View style={styles.detailHead}>
            <Text style={styles.detailTitle}>{selected.visitTypeLabel}</Text>
            <Text style={[styles.badge, { backgroundColor: statusTone(selected.status).bg, color: statusTone(selected.status).fg }]}>
              {selected.statusLabel}
            </Text>
          </View>
          <DetailRow label="Centre" value={selected.hospitalName} />
          <DetailRow label="Requested" value={formatWhen(selected.preferredAt)} />
          <DetailRow label="Scheduled" value={formatWhen(selected.scheduledAt)} />
          <DetailRow label="Doctor" value={selected.doctorName || "Waiting for the centre to assign"} />
          {selected.adminNote ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Message from the centre</Text>
              <Text style={styles.noteText}>{selected.adminNote}</Text>
            </View>
          ) : null}
          {["requested", "confirmed", "rescheduled"].includes(selected.status) ? (
            <Pressable style={styles.cancelBtn} onPress={() => void cancel(selected.id)}>
              <Text style={styles.cancelText}>Cancel this request</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* List */}
      <Text style={styles.section}>Your visits</Text>
      {items.length === 0 && !loading ? (
        <Text style={styles.empty}>No appointments yet. Tap “New request” and your centre will reply here.</Text>
      ) : null}
      {items.map((item) => (
        <Pressable key={item.id} style={styles.listRow} onPress={() => setSelectedId(item.id)}>
          <View style={styles.listBody}>
            <Text style={styles.listTitle}>{item.visitTypeLabel}</Text>
            <Text style={styles.listMeta}>{item.hospitalName}</Text>
            <Text style={styles.listMeta}>
              {item.scheduledAt ? formatWhen(item.scheduledAt) : `Requested ${formatWhen(item.preferredAt)}`}
            </Text>
          </View>
          <Text style={[styles.badge, { backgroundColor: statusTone(item.status).bg, color: statusTone(item.status).fg }]}>
            {item.statusLabel}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 14, paddingBottom: 40 },

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerText: { flex: 1, marginRight: 10 },
  title: { fontSize: 20, fontWeight: "700", color: C.navy },
  subtitle: { marginTop: 2, fontSize: 12, color: C.muted },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.red,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  newBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  error: { color: C.red, marginBottom: 8, fontSize: 12 },

  card: {
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 12,
  },

  stepsRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  stepItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.card,
  },
  stepDotActive: { borderColor: C.navy },
  stepDotDone: { backgroundColor: C.navy, borderColor: C.navy },
  stepNum: { fontSize: 11, fontWeight: "700", color: C.faint },
  stepNumActive: { color: C.navy },
  stepLine: { flex: 1, height: 1.5, backgroundColor: C.border, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: C.navy },
  stepTitle: { fontSize: 16, fontWeight: "700", color: C.navy, marginBottom: 10 },

  optionList: { gap: 0 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F1F3",
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioOn: { borderColor: C.red },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.red },
  optionBody: { flex: 1 },
  optionTitle: { fontSize: 14, fontWeight: "600", color: C.text },
  optionHint: { marginTop: 1, fontSize: 12, color: C.muted },

  emptySlots: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptySlotsText: { textAlign: "center", color: C.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: 10 },

  dayBlock: { marginBottom: 12 },
  dayLabel: { fontSize: 13, fontWeight: "600", color: C.text, marginBottom: 6 },
  timeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeBox: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: C.card,
  },
  timeBoxOn: { borderColor: C.navy, backgroundColor: C.navy },
  timeText: { fontSize: 13, fontWeight: "600", color: C.text },
  timeTextOn: { color: "#fff" },

  input: {
    minHeight: 84,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
    color: C.text,
    fontSize: 13,
  },
  summary: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#F0F1F3", paddingTop: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  summaryLabel: { fontSize: 12, color: C.muted },
  summaryValue: { fontSize: 12, fontWeight: "600", color: C.text, flexShrink: 1, textAlign: "right" },

  footerRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 14 },
  backBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  backText: { color: C.text, fontWeight: "600", fontSize: 13 },
  nextBtn: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: C.red },
  nextText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  btnDisabled: { opacity: 0.45 },

  detailHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  detailTitle: { fontSize: 16, fontWeight: "700", color: C.navy, flex: 1, marginRight: 8 },
  detailRow: { flexDirection: "row", paddingVertical: 4 },
  detailLabel: { width: 84, fontSize: 12, color: C.muted },
  detailValue: { flex: 1, fontSize: 12, color: C.text, fontWeight: "500" },
  noteBox: { marginTop: 8, backgroundColor: C.grayBg, borderRadius: 8, padding: 10 },
  noteLabel: { fontSize: 11, fontWeight: "700", color: C.muted, marginBottom: 2 },
  noteText: { fontSize: 12, color: C.text, lineHeight: 17 },
  cancelBtn: { marginTop: 10, alignSelf: "flex-start" },
  cancelText: { color: C.red, fontWeight: "600", fontSize: 12 },

  badge: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "700",
  },

  section: { marginTop: 4, marginBottom: 8, fontSize: 15, fontWeight: "700", color: C.navy },
  empty: { color: C.muted, lineHeight: 19, fontSize: 12 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 8,
  },
  listBody: { flex: 1, marginRight: 8 },
  listTitle: { fontWeight: "700", color: C.navy, fontSize: 14 },
  listMeta: { color: C.muted, fontSize: 12, marginTop: 2 },
});
