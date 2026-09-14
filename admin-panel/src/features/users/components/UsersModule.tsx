"use client";

import { Users } from "lucide-react";

export default function UsersModule() {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h1 className="text-[15px] font-semibold text-ink">Users Management</h1>
        <p className="text-[11px] text-muted">Super Admin only — national account directory. Home &gt; Users Management</p>
      </div>

      <article className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Users className="size-6" />
        </span>
        <h2 className="text-[14px] font-semibold text-ink">No user directory yet</h2>
        <p className="max-w-md text-[12px] leading-5 text-muted">
          Admin accounts are managed under Admin Management and Hospital Administration. A unified national user
          directory will appear here when that API is available.
        </p>
      </article>
    </div>
  );
}
