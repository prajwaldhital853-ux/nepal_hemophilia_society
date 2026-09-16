"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiFetch, clearAccessToken, getAccessToken, refreshAccessToken } from "@/lib/api";
import {
  USER_KEY,
  migrateLegacyAuthStorage,
  readAuthValue,
  writeAuthValue,
  removeAuthValue,
} from "@/lib/authStorage";
import { ACTION_ROUTES, isWebsiteRoute, navAllows, Perm } from "@/lib/permissions";

export type AdminRole = "super_admin" | "admin" | "province_admin" | "hospital_admin" | "website_manager";
export type AdminKind = "super_admin" | "admin" | "province_admin" | "center_admin" | "treatment_admin" | "website_manager";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: AdminRole;
  kind?: AdminKind;
  viewOnly?: boolean;
  permissions: string[];
  nav: string[];
  must_change_password?: boolean;
  photoUrl?: string;
  staffId?: string;
  hospitalStaff?: {
    id: string;
    staffType: "treatment_admin" | "center_admin";
    treatmentCenter: string;
    province: string;
  } | null;
  provinceAdmin?: { id: string; province: string; provinceId?: number; defaultLoggingCenter?: string } | null;
  scope?: { kind: string; provinceId?: number | null; hospitalId?: number | null };
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  can: (permission: string) => boolean;
  canOpen: (href: string) => boolean;
  setSession: (user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readCachedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = readAuthValue(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function persistUser(user: AuthUser) {
  writeAuthValue(USER_KEY, JSON.stringify(user));
}

export function isAdminUser(user: AuthUser | null): user is AuthUser {
  return Boolean(user && user.role !== ("patient" as string));
}

export function pathAllowed(pathname: string, user: AuthUser) {
  if (!isAdminUser(user)) return false;
  if (isWebsiteRoute(pathname)) {
    return user.permissions?.includes(Perm.websiteView) ?? false;
  }
  const action = ACTION_ROUTES.find((route) => route.test(pathname));
  if (action) return user.permissions?.includes(action.permission) ?? false;
  if (pathname === "/dashboard") return user.permissions?.includes("dashboard") ?? user.nav?.includes("/dashboard") ?? false;
  return navAllows(pathname, user.nav ?? []);
}

export function isNationalScope(user: AuthUser | null | undefined) {
  return user?.role === "super_admin" || user?.role === "admin";
}

export function homeForUser(user: AuthUser) {
  if (user.role === "website_manager" || user.kind === "website_manager") return "/dashboard/website";
  if (user.role === "hospital_admin") {
    return user.hospitalStaff?.staffType === "center_admin"
      ? "/dashboard/hospitals/center-admins"
      : "/dashboard/injections";
  }
  if (user.role === "province_admin") return "/dashboard/patients";
  return "/dashboard";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    migrateLegacyAuthStorage();
    const cached = readCachedUser();
    if (cached) setUser(cached);
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    void apiFetch("/auth/me/")
      .then((data) => {
        const next = data as AuthUser;
        persistUser(next);
        setUser(next);
      })
      .catch(async () => {
        const renewed = await refreshAccessToken();
        if (renewed) {
          try {
            const data = await apiFetch("/auth/me/");
            const next = data as AuthUser;
            persistUser(next);
            setUser(next);
            return;
          } catch {
            // fall through
          }
        }
        clearAccessToken();
        removeAuthValue(USER_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    const renew = () => {
      if (document.visibilityState !== "visible") return;
      void refreshAccessToken();
    };
    const interval = window.setInterval(renew, 6 * 60 * 60 * 1000);
    document.addEventListener("visibilitychange", renew);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", renew);
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      can: (permission) => Boolean(user?.permissions?.includes(permission)),
      canOpen: (href) => (user ? pathAllowed(href, user) : false),
      setSession: (next) => {
        persistUser(next);
        setUser(next);
      },
      logout: () => {
        clearAccessToken();
        removeAuthValue(USER_KEY);
        setUser(null);
        window.location.href = "/login";
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, canOpen } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!user) return;
    if (user.must_change_password) {
      router.replace("/change-password");
      return;
    }
    if (!canOpen(pathname)) {
      router.replace(homeForUser(user));
    }
  }, [loading, user, pathname, canOpen, router]);

  if (loading || (getAccessToken() && !user)) {
    return <p className="p-6 text-[12px] text-muted">Checking access…</p>;
  }
  if (!getAccessToken() || !user) return null;
  if (user.must_change_password) {
    return <p className="p-6 text-[12px] text-muted">Redirecting to set a new password…</p>;
  }
  if (!canOpen(pathname)) {
    return <p className="p-6 text-[12px] text-muted">You do not have access to this page.</p>;
  }
  return <>{children}</>;
}
