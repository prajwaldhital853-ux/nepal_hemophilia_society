"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type AdminNote = {
  id: number;
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export function AppointmentInbox() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNote[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = (await apiFetch("/notifications/admin/")) as { notifications?: AdminNote[] };
      const rows = Array.isArray(data.notifications) ? data.notifications : [];
      setItems(rows.filter((row) => !row.isRead && row.category === "appointment"));
    } catch {
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 25000);
    const onRefresh = () => void load();
    window.addEventListener("nhms-notifications-refresh", onRefresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("nhms-notifications-refresh", onRefresh);
    };
  }, [load]);

  async function openOne(note: AdminNote) {
    await apiFetch(`/notifications/admin/${note.id}/read/`, { method: "POST" });
    setItems((rows) => rows.filter((row) => row.id !== note.id));
    setOpen(false);
    router.push("/dashboard/appointments");
  }

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        className="panel relative p-1.5 text-muted shadow-none hover:bg-elevated hover:text-ink"
        aria-label="Appointment messages"
        onClick={() => setOpen((value) => !value)}
      >
        <Mail className="size-4" />
        {items.length > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#001D3D] px-1 text-center text-[10px] font-bold leading-4 text-white">
            {items.length > 9 ? "9+" : items.length}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[340px] max-w-[80vw] rounded-xl border border-black/10 bg-card shadow-lg">
          <div className="border-b border-black/5 px-3 py-2">
            <p className="text-[13px] font-semibold text-ink">Appointment messages</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12px] text-muted">No new appointment messages.</p>
            ) : (
              items.map((note) => (
                <button key={note.id} type="button" className="block w-full border-b border-black/5 px-3 py-2 text-left hover:bg-elevated" onClick={() => void openOne(note)}>
                  <p className="text-[12px] font-semibold text-ink">{note.title}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted">{note.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
