import type { AuthUser } from "@/lib/auth";

type StaffIdentity = {
  id?: string;
  userId?: number;
  username?: string;
  email?: string;
};

/** True when the signed-in admin is viewing their own staff account. */
export function isOwnStaffAccount(user: AuthUser | null | undefined, staff: StaffIdentity | null | undefined) {
  if (!user || !staff) return false;
  if (staff.userId != null && user.id != null && Number(staff.userId) === Number(user.id)) return true;
  if (user.staffId && staff.id && user.staffId === staff.id) return true;
  if (user.username && staff.username && user.username === staff.username) return true;
  if (user.email && staff.email && user.email.toLowerCase() === staff.email.toLowerCase()) return true;
  return false;
}
