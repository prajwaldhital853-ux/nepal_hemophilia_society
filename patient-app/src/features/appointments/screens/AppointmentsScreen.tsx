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
import { useClearTopics } from "@/features/notifications/useClearTopics";
import { servicesColors } from "@/features/services/theme/servicesTheme";

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

const VISIT_TYPES = [
  { id: "clinic_review", label: "Clinic review", hint: "Routine haematology visit" },
  { id: "prophylaxis", label: "Prophylaxis", hint: "Plan or review regular treatment" },
  { id: "bleed_followup", label: "Bleed follow-up", hint: "After a joint or muscle bleed" },
  { id: "physiotherapy", label: "Physiotherapy", hint: "Joint movement and strength" },
  { id: "dental", label: "Dental planning", hint: "Before a dental procedure" },
  { id: "counselling", label: "Counselling", hint: "Family or youth support" },
];

const TIMES = ["09:00", "10:00", "11:30", "13:00", "14:30", "16:00"];

type Props = StackScreenProps<RootStackParamList, "Appointments">;

function formatWhen(iso?: string | null) {
  if (!iso) return "Not scheduled yet";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function statusTone(status: string) {
  if (status === "confirmed" || status === "completed") return { bg: "#ECFDF5", fg: "#047857" };
  if (status === "declined" || status === "cancelled") return { bg: "#FEF2F2", fg: "#B91C1C" };
  if (status === "rescheduled") return { bg: "#EFF6FF", fg: "#1D4ED8" };
  return { bg: "#FFF7ED", fg: "#C2410C" };
}

export default function AppointmentsScreen({ route }: Props) {
  useClearTopics("Appointments");
  const { token, patient } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(0);
  const [visitType, setVisitType] = useState("clinic_review");
  const [hospitalId, setHospitalId] = useState<number | null>(null);
  const [dayOffset, setDayOffset] = useState(1);
  const [time, setTime] = useState("10:00");
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
      if (!hospitalId && rows[0]) setHospitalId(rows[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load appointments");
    } finally {
      setLoading(false);
    }
  }, [hospitalId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index + 1);
      date.setHours(0, 0, 0, 0);
      return date;
    });
  }, []);

  const selected = items.find((item) => item.id === selectedId) ?? null;

  async function submit() {
    if (!token || !hospitalId) return;
    const day = days[dayOffset] ?? days[0];
    const [hour, minute] = time.split(":").map(Number);
    const when = new Date(day);
    when.setHours(hour, minute, 0, 0);
    setSaving(true);
    setError("");
    try {
      const data = await patientApi("/me/patient/appointments/", {
        method: "POST",
        token,
        body: JSON.stringify({
          visitType,
          hospitalId,
          preferredAt: when.toISOString(),
          reason,
        }),
      });
      setBooking(false);
      setStep(0);
      setReason("");
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
      <View style={styles.hero}>
        <Text style={styles.kicker}>Care visits</Text>
        <Text style={styles.title}>Book a centre visit</Text>
        <Text style={styles.lead}>
          Choose a visit, a day, and a time. {patient?.primaryHospital || "Your centre"} and the province team can confirm the doctor.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => { setBooking(true); setSelectedId(null); setStep(0); }}>
          <Text style={styles.primaryText}>Request an appointment</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color={servicesColors.primary} /> : null}

      {booking ? (
        <View style={styles.card}>
          <Text style={styles.stepLabel}>Step {step + 1} of 4</Text>
          {step === 0 ? (
            <>
              <Text style={styles.cardTitle}>What kind of visit?</Text>
              {VISIT_TYPES.map((type) => (
                <Pressable key={type.id} style={[styles.choice, visitType === type.id && styles.choiceOn]} onPress={() => setVisitType(type.id)}>
                  <Text style={styles.choiceTitle}>{type.label}</Text>
                  <Text style={styles.choiceHint}>{type.hint}</Text>
                </Pressable>
              ))}
            </>
          ) : null}
          {step === 1 ? (
            <>
              <Text style={styles.cardTitle}>Which centre?</Text>
              {centers.map((center) => (
                <Pressable key={center.id} style={[styles.choice, hospitalId === center.id && styles.choiceOn]} onPress={() => setHospitalId(center.id)}>
                  <Text style={styles.choiceTitle}>{center.name}</Text>
                  <Text style={styles.choiceHint}>{center.province}</Text>
                </Pressable>
              ))}
            </>
          ) : null}
          {step === 2 ? (
            <>
              <Text style={styles.cardTitle}>Preferred day and time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
                {days.map((day, index) => (
                  <Pressable key={day.toISOString()} style={[styles.dayChip, dayOffset === index && styles.dayChipOn]} onPress={() => setDayOffset(index)}>
                    <Text style={[styles.dayChipText, dayOffset === index && styles.dayChipTextOn]}>
                      {day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.timeGrid}>
                {TIMES.map((slot) => (
                  <Pressable key={slot} style={[styles.timeChip, time === slot && styles.dayChipOn]} onPress={() => setTime(slot)}>
                    <Text style={[styles.dayChipText, time === slot && styles.dayChipTextOn]}>{slot}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          {step === 3 ? (
            <>
              <Text style={styles.cardTitle}>Why do you need this visit?</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Example: left knee still swollen after Friday's bleed"
                placeholderTextColor="#9CA3AF"
                multiline
                style={styles.input}
              />
            </>
          ) : null}
          <View style={styles.row}>
            {step > 0 ? (
              <Pressable style={styles.ghostBtn} onPress={() => setStep((value) => value - 1)}>
                <Text style={styles.ghostText}>Back</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.ghostBtn} onPress={() => setBooking(false)}>
                <Text style={styles.ghostText}>Close</Text>
              </Pressable>
            )}
            {step < 3 ? (
              <Pressable style={styles.primaryBtn} onPress={() => setStep((value) => value + 1)}>
                <Text style={styles.primaryText}>Continue</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.primaryBtn} disabled={saving || reason.trim().length < 4} onPress={() => void submit()}>
                <Text style={styles.primaryText}>{saving ? "Sending..." : "Send request"}</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}

      {selected ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{selected.visitTypeLabel}</Text>
          <Text style={[styles.badge, { backgroundColor: statusTone(selected.status).bg, color: statusTone(selected.status).fg }]}>
            {selected.statusLabel}
          </Text>
          <Track status={selected.status} />
          <Text style={styles.meta}>Centre: {selected.hospitalName}</Text>
          <Text style={styles.meta}>Requested: {formatWhen(selected.preferredAt)}</Text>
          <Text style={styles.meta}>Scheduled: {formatWhen(selected.scheduledAt)}</Text>
          <Text style={styles.meta}>Doctor: {selected.doctorName || "Waiting for the centre to assign"}</Text>
          {selected.adminNote ? <Text style={styles.note}>{selected.adminNote}</Text> : null}
          {["requested", "confirmed", "rescheduled"].includes(selected.status) ? (
            <Pressable style={styles.ghostBtn} onPress={() => void cancel(selected.id)}>
              <Text style={styles.ghostText}>Cancel this request</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.section}>Your visits</Text>
      {items.length === 0 && !loading ? <Text style={styles.empty}>No appointments yet. Send a request and your centre will reply here.</Text> : null}
      {items.map((item) => (
        <Pressable key={item.id} style={styles.listCard} onPress={() => setSelectedId(item.id)}>
          <View style={styles.listTop}>
            <Text style={styles.listTitle}>{item.visitTypeLabel}</Text>
            <Text style={[styles.badge, { backgroundColor: statusTone(item.status).bg, color: statusTone(item.status).fg }]}>{item.statusLabel}</Text>
          </View>
          <Text style={styles.meta}>{item.hospitalName}</Text>
          <Text style={styles.meta}>{item.scheduledAt ? formatWhen(item.scheduledAt) : `Requested ${formatWhen(item.preferredAt)}`}</Text>
          <Text style={styles.meta}>{item.doctorName ? `Dr ${item.doctorName.replace(/^Dr\s+/i, "")}` : "Doctor not assigned yet"}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Track({ status }: { status: string }) {
  const steps = ["Sent", "Review", "Scheduled", "Visit"];
  const index = status === "completed" ? 3 : status === "confirmed" || status === "rescheduled" ? 2 : status === "requested" ? 0 : 1;
  return (
    <View style={styles.track}>
      {steps.map((label, step) => (
        <View key={label} style={styles.trackItem}>
          <View style={[styles.dot, step <= index && styles.dotOn]} />
          <Text style={styles.trackLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: servicesColors.pageBg },
  content: { padding: 16, paddingBottom: 40 },
  hero: { backgroundColor: servicesColors.navy, borderRadius: 20, padding: 18, marginBottom: 14 },
  kicker: { color: "#FCA5A5", fontSize: 12, fontWeight: "800", letterSpacing: 0.4 },
  title: { marginTop: 6, color: "#fff", fontSize: 24, fontWeight: "800" },
  lead: { marginTop: 8, color: "#E5E7EB", lineHeight: 20 },
  primaryBtn: { marginTop: 14, backgroundColor: servicesColors.primary, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "800" },
  error: { color: servicesColors.primary, marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: servicesColors.border },
  stepLabel: { color: servicesColors.primary, fontWeight: "800", fontSize: 12 },
  cardTitle: { marginTop: 4, marginBottom: 10, fontSize: 18, fontWeight: "800", color: servicesColors.navy },
  choice: { borderWidth: 1, borderColor: servicesColors.border, borderRadius: 14, padding: 12, marginBottom: 8 },
  choiceOn: { borderColor: servicesColors.primary, backgroundColor: "#FFF1F2" },
  choiceTitle: { fontWeight: "800", color: servicesColors.navy },
  choiceHint: { marginTop: 2, color: servicesColors.textMuted, fontSize: 12 },
  dayRow: { marginBottom: 10 },
  dayChip: { borderWidth: 1, borderColor: servicesColors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  dayChipOn: { backgroundColor: servicesColors.navy, borderColor: servicesColors.navy },
  dayChipText: { color: servicesColors.navy, fontWeight: "700", fontSize: 12 },
  dayChipTextOn: { color: "#fff" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: { borderWidth: 1, borderColor: servicesColors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  input: { minHeight: 90, borderWidth: 1, borderColor: servicesColors.border, borderRadius: 14, padding: 12, textAlignVertical: "top", color: servicesColors.text },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 8 },
  ghostBtn: { marginTop: 14, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: servicesColors.border },
  ghostText: { color: servicesColors.navy, fontWeight: "800" },
  badge: { alignSelf: "flex-start", overflow: "hidden", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, fontWeight: "800", marginBottom: 8 },
  meta: { color: servicesColors.text, marginTop: 4 },
  note: { marginTop: 8, backgroundColor: "#FFF7ED", borderRadius: 12, padding: 10, color: "#9A3412" },
  section: { marginTop: 8, marginBottom: 8, fontSize: 16, fontWeight: "800", color: servicesColors.navy },
  empty: { color: servicesColors.textMuted, lineHeight: 20 },
  listCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: servicesColors.border },
  listTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  listTitle: { fontWeight: "800", color: servicesColors.navy, flex: 1, marginRight: 8 },
  track: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  trackItem: { alignItems: "center", flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#E5E7EB" },
  dotOn: { backgroundColor: servicesColors.primary },
  trackLabel: { marginTop: 4, fontSize: 10, fontWeight: "700", color: servicesColors.textMuted },
});
