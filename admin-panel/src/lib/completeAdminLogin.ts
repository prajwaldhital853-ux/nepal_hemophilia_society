import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { AuthUser } from "@/lib/auth";
import { homeForUser } from "@/lib/auth";
import { setAuthTokens } from "@/lib/api";
import { clearPreAuthToken } from "@/lib/twoFactorSession";

type LoginPayload = {
  access?: string;
  refresh?: string;
  user?: AuthUser;
  mustChangePassword?: boolean;
  passwordExpired?: boolean;
};

export function finishAdminLogin(
  data: LoginPayload,
  setSession: (user: AuthUser) => void,
  router: AppRouterInstance,
) {
  if (!data.access) throw new Error("Login failed");
  if (data.user?.role === "patient") {
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
