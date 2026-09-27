import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { AdminRole, AuthUser } from "@/lib/auth";
import { homeForUser } from "@/lib/auth";
import { setAuthTokens } from "@/lib/api";
import { clearPreAuthToken } from "@/lib/twoFactorSession";

/** Login API may return non-admin roles before tokens are rejected server-side. */
type LoginUser = Omit<AuthUser, "role"> & { role: AdminRole | "patient" };

type LoginPayload = {
  access?: string;
  refresh?: string;
  user?: LoginUser;
  mustChangePassword?: boolean;
  passwordExpired?: boolean;
};

function isLoginAdminUser(user: LoginUser): user is AuthUser {
  return user.role !== "patient";
}

export function finishAdminLogin(
  data: LoginPayload,
  setSession: (user: AuthUser) => void,
  router: AppRouterInstance,
) {
  if (!data.access) throw new Error("Login failed");
  if (data.user && !isLoginAdminUser(data.user)) {
    throw new Error("Patient accounts cannot use the admin panel");
  }
  clearPreAuthToken();
  setAuthTokens(data.access, data.refresh);
  if (data.user) setSession(data.user);
  if (
    data.mustChangePassword ||
    data.passwordExpired ||
    data.user?.must_change_password ||
    data.user?.passwordExpired
  ) {
    router.push("/change-password");
    return;
  }
  router.push(data.user ? homeForUser(data.user) : "/dashboard");
}
