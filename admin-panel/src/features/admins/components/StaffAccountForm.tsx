"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, KeyRound, MapPin, Shield, UserRound } from "lucide-react";

import PermissionMatrix from "@/features/admins/components/PermissionMatrix";
import RolePresetPicker, { RolePresetSummary } from "@/features/admins/components/RolePresetPicker";
import {
  KIND_LABELS,
  createStaffAccount,
  fetchStaffCatalog,
  updateStaffAccount,
  type AssignableRole,
  type PermissionGroup,
  type StaffKind,
  type StaffRecord,
} from "@/features/admins/api";
import { fetchHospitals } from "@/features/hospitals/api";
import type { HospitalOption } from "@/features/hospitals/types";
import { provinceDistricts } from "@/features/patients/data/geo";
import { NEPAL_PROVINCES } from "@/lib/constants/provinces";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const steps = [
  { id: 1, label: "Identity", icon: UserRound },
  { id: 2, label: "Assignment", icon: MapPin },
  { id: 3, label: "Access", icon: Shield },
  { id: 4, label: "Login", icon: KeyRound },
  { id: 5, label: "Review", icon: Check },
];

const fieldClass =
  "mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-muted">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {children}
      {error ? <p className="mt-1 text-[10px] font-semibold text-red-600">{error}</p> : null}
    </label>
  );
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => chars[n % chars.length]).join("");
}

type FormState = {
  kind: StaffKind | "";
  fullName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  nationalId: string;
  employeeId: string;
  designation: string;
  province: string;
  district: string;
  officeAddress: string;
  treatmentCenter: string;
  notes: string;
  viewOnly: boolean;
  permissions: string[];
  temporaryPassword: string;
};

const emptyForm = (): FormState => ({
  kind: "",
  fullName: "",
  dateOfBirth: "",
  gender: "",
  email: "",
  phone: "",
  nationalId: "",
  employeeId: "",
  designation: "",
  province: "",
  district: "",
  officeAddress: "",
  treatmentCenter: "",
  notes: "",
  viewOnly: false,
  permissions: [],
  temporaryPassword: generateTempPassword(),
});

function formFromStaff(staff: StaffRecord): FormState {
  return {
    kind: staff.kind,
    fullName: staff.fullName,
    dateOfBirth: staff.dateOfBirth || "",
    gender: staff.gender || "",
    email: staff.email,
    phone: staff.phone,
    nationalId: staff.nationalId || "",
    employeeId: staff.employeeId || "",
    designation: staff.designation || "",
    province: staff.province || "",
    district: "",
    officeAddress: staff.officeAddress || "",
    treatmentCenter: staff.treatmentCenter || "",
    notes: staff.notes || "",
    viewOnly: staff.viewOnly,
    permissions: staff.permissions || [],
    temporaryPassword: "",
  };
}

function validateStep(
  step: number,
  form: FormState,
  role: AssignableRole | undefined,
  mode: "create" | "edit",
  takenProvinces: string[] = [],
) {
  const errors: Record<string, string> = {};
  if (step === 1) {
    if (!form.fullName.trim()) errors.fullName = "Full name is required";
    if (!form.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!form.gender) errors.gender = "Gender is required";
    if (!form.email.trim()) errors.email = "Email is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email";
    const mobile = form.phone.replace(/\s/g, "").replace(/^\+977/, "");
    if (!form.phone.trim()) errors.phone = "Mobile number is required";
    else if (!/^(97|98)\d{8}$/.test(mobile)) errors.phone = "Use a Nepal mobile: 98 or 97 followed by 8 digits";
    if (!form.designation.trim()) errors.designation = "Designation is required";
  }
  if (step === 2) {
    if (!form.kind) errors.kind = "Select an admin role";
    if (role?.requiresProvince && !form.province) errors.province = "Province is required";
    if (
      role?.requiresProvince &&
      form.province &&
      mode === "create" &&
      takenProvinces.includes(form.province)
    ) {
      errors.province = "This province already has a Province Admin. Choose another province.";
    }
    if (role?.requiresHospital && !form.treatmentCenter) errors.treatmentCenter = "Treatment center is required";
    if (!form.officeAddress.trim()) errors.officeAddress = "Office address is required";
  }
  if (step === 3 && !form.permissions.length) errors.permissions = "Select at least one permission, or use View pages only";
  if (step === 4 && mode === "create" && form.temporaryPassword.trim().length < 8) {
    errors.temporaryPassword = "Temporary password must be at least 8 characters";
  }
  return errors;
}

export default function StaffAccountForm({
  mode = "create",
  lockedKind,
  initial,
  takenProvinces = [],
  onClose,
  onSaved,
}: {
  mode?: "create" | "edit";
  lockedKind?: StaffKind;
  initial?: StaffRecord;
  takenProvinces?: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(() => (initial ? formFromStaff(initial) : { ...emptyForm(), kind: lockedKind || "" }));
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<string[]>([...NEPAL_PROVINCES]);
  const [taken, setTaken] = useState<string[]>(takenProvinces);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(initial?.photoUrl || "");
  const [credentials, setCredentials] = useState<{
    adminId: string;
    username: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);

  const selectedRole = roles.find((role) => role.kind === form.kind);
  const isProvinceAdminRole = form.kind === "province_admin";

  function defaultsForKind(kind: StaffKind | "") {
    if (!kind) return [];
    return roles.find((role) => role.kind === kind)?.defaults ?? [];
  }

  function selectRole(kind: StaffKind) {
    const defaults = defaultsForKind(kind);
    patch({ kind, permissions: defaults, viewOnly: false });
  }

  useEffect(() => {
    void fetchHospitals()
      .then(setHospitals)
      .catch(() => setHospitals([]));
    void apiFetch("/provinces/")
      .then((data) => {
        const names = Array.isArray(data.provinces)
          ? data.provinces.map((row: { name: string }) => row.name).filter(Boolean)
          : [];
        if (names.length) setProvinceOptions(names);
      })
      .catch(() => setProvinceOptions([...NEPAL_PROVINCES]));
  }, []);

  useEffect(() => {
    void fetchStaffCatalog()
      .then((data) => {
        setRoles(data.assignableRoles);
        setTaken(data.takenProvinces);
        if (mode !== "create" || initial) return;
        const kind = lockedKind || data.assignableRoles[0]?.kind || "";
        if (!kind) return;
        const role = data.assignableRoles.find((item) => item.kind === kind);
        setForm((current) => {
          if (current.kind && current.permissions.length) return current;
          return {
            ...current,
            kind,
            permissions: role?.defaults ?? [],
          };
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load roles"));
  }, [initial, lockedKind, mode]);

  useEffect(() => {
    if (!form.kind) {
      setGroups([]);
      return;
    }
    void fetchStaffCatalog(form.kind)
      .then((data) => setGroups(data.permissionGroups))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load permissions"));
  }, [form.kind]);

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const districts = provinceDistricts[form.province] ?? [];

  function provinceIsTaken(name: string) {
    return taken.includes(name) && !(mode === "edit" && initial?.province === name);
  }
  const scopedHospitals = hospitals.filter((hospital) => {
    if (user?.role === "province_admin" && user.provinceAdmin?.province) {
      return hospital.province === user.provinceAdmin.province;
    }
    if (user?.role === "hospital_admin" && user.hospitalStaff?.treatmentCenter) {
      return hospital.name === user.hospitalStaff.treatmentCenter;
    }
    if (form.kind === "province_admin") return true;
    if (form.province) return hospital.province === form.province;
    return true;
  });
  const progress = ((step - 1) / (steps.length - 1)) * 100;

  function patch(partial: Partial<FormState>) {
    setForm((current) => {
      const next = { ...current, ...partial };
      if (partial.kind && partial.kind !== current.kind) {
        const role = roles.find((item) => item.kind === partial.kind);
        next.permissions = role?.defaults ?? [];
        next.viewOnly = false;
      }
      if (partial.viewOnly === true) {
        next.permissions = groups.flatMap((group) =>
          group.permissions.filter((perm) => perm.action === "view").map((perm) => perm.code),
        );
        if (!next.permissions.length) next.permissions = current.permissions;
      }
      if (partial.viewOnly === false && current.viewOnly) {
        const role = roles.find((item) => item.kind === next.kind);
        if (role?.defaults.length) next.permissions = role.defaults;
      }
      return next;
    });
    setFieldErrors({});
  }

  function goNext() {
    const nextErrors = validateStep(step, form, selectedRole, mode, taken);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setStep((value) => Math.min(5, value + 1));
  }

  async function submit() {
    const allErrors = [1, 2, 3, 4].reduce<Record<string, string>>(
      (acc, item) => ({ ...acc, ...validateStep(item, form, selectedRole, mode, taken) }),
      {},
    );
    setFieldErrors(allErrors);
    const firstInvalid = [1, 2, 3, 4].find(
      (item) => Object.keys(validateStep(item, form, selectedRole, mode, taken)).length,
    );
    if (firstInvalid) {
      setStep(firstInvalid);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        kind: form.kind,
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        email: form.email,
        phone: form.phone,
        nationalId: form.nationalId,
        employeeId: form.employeeId,
        designation: form.designation,
        province: form.province,
        officeAddress: form.district ? `${form.officeAddress}, ${form.district}` : form.officeAddress,
        treatmentCenter: form.treatmentCenter,
        notes: form.notes,
        viewOnly: form.viewOnly,
        permissions: form.permissions,
      };
      if (mode === "create") payload.temporaryPassword = form.temporaryPassword;
      if (mode === "edit" && form.temporaryPassword.trim()) {
        payload.resetTemporaryPassword = form.temporaryPassword;
        payload.resetPassword = true;
      }
      const data =
        mode === "edit" && initial
          ? await updateStaffAccount(initial.id, payload, photoFile)
          : await createStaffAccount(payload, photoFile);
      if (data.credentials) setCredentials(data.credentials);
      else onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save admin");
    } finally {
      setSaving(false);
    }
  }

  if (credentials) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="panel w-full max-w-md p-5">
          <h2 className="text-[14px] font-semibold text-ink">Account created</h2>
          <p className="mt-1 text-[11px] text-muted">
            Share these once. They can sign in with username, email, or Admin ID. The account stays Pending until they set their own password on first login — then it becomes Active automatically.
          </p>
          <dl className="mt-4 space-y-2 text-[11px]">
            {[
              ["Admin ID", credentials.adminId],
              ["Username", credentials.username],
              ["Email", credentials.email],
              ["Temporary password", credentials.temporaryPassword],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <button type="button" onClick={onSaved} className="mt-4 w-full rounded bg-brand py-2 text-[11px] font-semibold text-white">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="panel flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">
              {mode === "edit" ? "Edit admin profile" : "Add admin"}
            </h2>
            <p className="text-[11px] text-muted">
              Admin ID and username are created automatically. They sign in with username, email, or Admin ID, then must set their own password.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[11px] text-muted hover:text-ink">
            Close
          </button>
        </div>

        <div className="relative mt-3 h-1 rounded-full bg-elevated">
          <div className="absolute inset-y-0 left-0 rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
        <ol className="mt-2 grid grid-cols-5 gap-1">
          {steps.map((item) => {
            const Icon = item.icon;
            const active = step === item.id;
            const done = step > item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`flex w-full flex-col items-center gap-1 rounded-md px-1 py-1 text-[10px] ${
                    active ? "text-brand" : done ? "text-status-green" : "text-muted"
                  }`}
                >
                  <span className={`flex size-6 items-center justify-center rounded-full ${active ? "bg-brand text-white" : done ? "bg-status-green-soft" : "bg-elevated"}`}>
                    <Icon className="size-3.5" />
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="admin-scroll mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 flex items-center gap-3 rounded border border-line bg-elevated/40 px-3 py-2">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="" className="size-14 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex size-14 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
                    Photo
                  </span>
                )}
                <label className="block min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-muted">Profile photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                    className={`${fieldClass} file:mr-2 file:rounded file:border-0 file:bg-brand file:px-2 file:py-1 file:text-[10px] file:text-white`}
                    onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  />
                  <span className="mt-1 block text-[10px] text-muted">JPG or PNG. The admin can also change this later from their sidebar photo.</span>
                </label>
              </div>
              <Field label="Full name" required error={fieldErrors.fullName}>
                <input className={fieldClass} value={form.fullName} onChange={(e) => patch({ fullName: e.target.value })} />
              </Field>
              <Field label="Date of birth" required error={fieldErrors.dateOfBirth}>
                <input type="date" className={fieldClass} value={form.dateOfBirth} onChange={(e) => patch({ dateOfBirth: e.target.value })} />
              </Field>
              <Field label="Gender" required error={fieldErrors.gender}>
                <select className={fieldClass} value={form.gender} onChange={(e) => patch({ gender: e.target.value })}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Official email" required error={fieldErrors.email}>
                <input type="email" className={fieldClass} value={form.email} onChange={(e) => patch({ email: e.target.value })} />
              </Field>
              <Field label="Mobile" required error={fieldErrors.phone}>
                <input className={fieldClass} value={form.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="98XXXXXXXX" />
              </Field>
              <Field label="Citizenship / National ID">
                <input className={fieldClass} value={form.nationalId} onChange={(e) => patch({ nationalId: e.target.value })} />
              </Field>
              <Field label="Employee ID">
                <input className={fieldClass} value={form.employeeId} onChange={(e) => patch({ employeeId: e.target.value })} />
              </Field>
              <Field label="Designation" required error={fieldErrors.designation}>
                <input className={fieldClass} value={form.designation} onChange={(e) => patch({ designation: e.target.value })} placeholder="Province Coordinator" />
              </Field>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-[11px] font-medium text-muted">
                  Admin role <span className="text-red-500">*</span>
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Pick a role preset first — standard permissions for that role are auto-selected on the Access step. You can
                  uncheck any permission before creating the account.
                </p>
                {fieldErrors.kind ? <p className="mt-1 text-[10px] font-semibold text-red-600">{fieldErrors.kind}</p> : null}
                <div className="mt-2">
                  {lockedKind || mode === "edit" ? (
                    form.kind ? <RolePresetSummary kind={form.kind} /> : null
                  ) : (
                    <RolePresetPicker
                      roles={roles}
                      selected={form.kind}
                      onSelect={selectRole}
                    />
                  )}
                </div>
              </div>
              {isProvinceAdminRole ? (
                <div className="sm:col-span-2">
                  <Field label="Assigned province" required error={fieldErrors.province}>
                    <select
                      className={fieldClass}
                      value={form.province}
                      onChange={(e) => patch({ province: e.target.value, district: "" })}
                    >
                      <option value="">Select province</option>
                      {provinceOptions.map((name) => (
                        <option key={name} value={name} disabled={provinceIsTaken(name)}>
                          {name}
                          {provinceIsTaken(name) ? " (already has a Province Admin)" : ""}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block text-[10px] text-muted">
                      All 7 provinces are listed. Provinces that already have a Province Admin are greyed out.
                    </span>
                  </Field>
                </div>
              ) : (
                <Field label="Office province">
                  <select className={fieldClass} value={form.province} onChange={(e) => patch({ province: e.target.value, district: "" })}>
                    <option value="">Select province</option>
                    {provinceOptions.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Office district">
                <select className={fieldClass} value={form.district} onChange={(e) => patch({ district: e.target.value })} disabled={!districts.length}>
                  <option value="">Select district</option>
                  {districts.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </Field>
              {selectedRole?.requiresHospital ? (
                <Field label="Treatment center" required error={fieldErrors.treatmentCenter}>
                  <select className={fieldClass} value={form.treatmentCenter} onChange={(e) => patch({ treatmentCenter: e.target.value })}>
                    <option value="">Select center</option>
                    {scopedHospitals.map((hospital) => (
                      <option key={hospital.id} value={hospital.name}>
                        {hospital.name} ({hospital.province})
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
              <div className="sm:col-span-2">
                <Field label="Office address" required error={fieldErrors.officeAddress}>
                  <textarea className={fieldClass} rows={2} value={form.officeAddress} onChange={(e) => patch({ officeAddress: e.target.value })} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Notes">
                  <textarea className={fieldClass} rows={2} value={form.notes} onChange={(e) => patch({ notes: e.target.value })} />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              {form.kind ? <RolePresetSummary kind={form.kind} /> : null}
              {selectedRole ? (
                <p className="text-[11px] text-muted">
                  <span className="font-semibold text-ink">{selectedRole.defaults.length}</span> standard permissions for{" "}
                  <span className="font-semibold text-ink">{selectedRole.label}</span> are pre-checked below (
                  <span className="font-semibold text-ink">{form.permissions.length}</span> currently selected).
                </p>
              ) : null}
              <label className="flex items-start gap-2 rounded border border-line bg-elevated/40 px-3 py-2 text-[12px]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.viewOnly}
                  onChange={(e) => patch({ viewOnly: e.target.checked })}
                />
                <span>
                  <span className="font-semibold text-ink">View-only mode</span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    This admin can open selected pages but cannot use Add, Update, or Delete.
                  </span>
                </span>
              </label>
              {fieldErrors.permissions ? <p className="text-[10px] font-semibold text-red-600">{fieldErrors.permissions}</p> : null}
              {!form.kind ? (
                <p className="rounded border border-dashed border-line bg-elevated/40 px-4 py-6 text-center text-[12px] text-muted">
                  Go back to Assignment and choose an admin role preset first.
                </p>
              ) : (
                <PermissionMatrix
                  groups={groups}
                  selected={form.permissions}
                  viewOnly={form.viewOnly}
                  roleDefaults={selectedRole?.defaults}
                  roleLabel={selectedRole?.label}
                  onChange={(permissions) => patch({ permissions })}
                />
              )}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="grid max-w-lg gap-3">
              <Field
                label={mode === "edit" ? "Reset temporary password (optional)" : "Temporary password"}
                required={mode === "create"}
                error={fieldErrors.temporaryPassword}
              >
                <div className="mt-1 flex gap-2">
                  <input className={fieldClass + " mt-0"} value={form.temporaryPassword} onChange={(e) => patch({ temporaryPassword: e.target.value })} />
                  <button type="button" className="rounded border border-line px-2 text-[10px]" onClick={() => patch({ temporaryPassword: generateTempPassword() })}>
                    Generate
                  </button>
                </div>
              </Field>
              <p className="text-[11px] text-muted">
                Username is generated from the email. Admin ID is assigned automatically. They can sign in with username, email, or Admin ID and this temporary password. The account stays Pending until they create their own password on first login, then it becomes Active.
              </p>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="grid gap-3 md:grid-cols-2">
              <article className="panel p-3 shadow-none">
                <h3 className="text-[12px] font-semibold">Profile</h3>
                <dl className="mt-2 space-y-1.5 text-[11px]">
                  {[
                    ["Name", form.fullName],
                    ["Role", form.kind ? KIND_LABELS[form.kind] : ""],
                    ["Email", form.email],
                    ["Phone", form.phone],
                    ["Designation", form.designation],
                    ["Province", form.province],
                    ["Center", form.treatmentCenter],
                    ["View only", form.viewOnly ? "Yes" : "No"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3">
                      <dt className="text-muted">{label}</dt>
                      <dd className="font-medium text-ink">{value || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </article>
              <article className="panel p-3 shadow-none">
                <h3 className="text-[12px] font-semibold">Granted permissions</h3>
                <p className="mt-1 text-[11px] text-muted">{form.permissions.length} selected. Drawer items follow these grants.</p>
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-[11px] text-ink">
                  {form.permissions.map((code) => (
                    <li key={code}>{code}</li>
                  ))}
                </ul>
              </article>
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}

        <div className="mt-3 flex justify-between gap-2">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((value) => Math.max(1, value - 1))}
            className="panel flex items-center gap-1 px-3 py-1.5 text-[11px] shadow-none disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
            Back
          </button>
          {step < 5 ? (
            <button type="button" onClick={goNext} className="flex items-center gap-1 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white">
              Next
              <ChevronRight className="size-3.5" />
            </button>
          ) : (
            <button type="button" disabled={saving} onClick={() => void submit()} className="rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60">
              {saving ? "Saving…" : mode === "edit" ? "Save profile" : "Create admin"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
