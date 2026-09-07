"use client";

import { useState } from "react";

import { createProvinceAdmin } from "@/features/admins/api";
import { provinces } from "@/features/admins/data/mockAdmins";

const fieldClass =
  "mt-1 w-full rounded border border-line-subtle bg-elevated px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-brand";

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => chars[n % chars.length]).join("");
}

type Props = {
  takenProvinces: string[];
  onClose: () => void;
  onCreated: () => void;
};

export default function AdminFormDialog({ takenProvinces, onClose, onCreated }: Props) {
  const available = provinces.filter((p) => !takenProvinces.includes(p));
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState(available[0] || "");
  const [temporaryPassword, setTemporaryPassword] = useState(generateTempPassword());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<{
    adminId: string;
    username: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await createProvinceAdmin({
        fullName,
        email,
        phone,
        province,
        temporaryPassword,
      });
      if (data.credentials) setCredentials(data.credentials);
      else onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create Province Admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="panel w-full max-w-md p-4">
        <h2 className="text-[14px] font-semibold text-ink">Add Province Admin</h2>
        <p className="mt-1 text-[11px] text-muted">One Province Admin per province (plan.md §5.2). Super Admin only.</p>
        {credentials ? (
          <div className="mt-3 space-y-2 text-[11px]">
            <p className="font-semibold text-ink">Account created. Share these once:</p>
            <p>ID: {credentials.adminId}</p>
            <p>Username: {credentials.username}</p>
            <p>Email: {credentials.email}</p>
            <p>Temporary password: {credentials.temporaryPassword}</p>
            <button type="button" className="mt-2 rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white" onClick={onCreated}>
              Done
            </button>
          </div>
        ) : (
          <form className="mt-3 space-y-2" onSubmit={onSubmit}>
            <label className="block text-[11px] text-muted">
              Full name
              <input className={fieldClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
            <label className="block text-[11px] text-muted">
              Email
              <input type="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="block text-[11px] text-muted">
              Phone
              <input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="block text-[11px] text-muted">
              Province
              <select className={fieldClass} value={province} onChange={(e) => setProvince(e.target.value)} required>
                {available.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] text-muted">
              Temporary password
              <div className="flex gap-2">
                <input className={fieldClass + " mt-0"} value={temporaryPassword} onChange={(e) => setTemporaryPassword(e.target.value)} />
                <button type="button" className="rounded border border-line px-2 text-[10px]" onClick={() => setTemporaryPassword(generateTempPassword())}>
                  Generate
                </button>
              </div>
            </label>
            {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
            {!available.length ? <p className="text-[11px] text-muted">All seven provinces already have a Province Admin.</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="panel px-3 py-1.5 text-[11px] shadow-none" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !available.length}
                className="rounded bg-brand px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Saving…" : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
