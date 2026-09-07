"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiFetch, clearAccessToken, getAccessToken } from "@/lib/api";
import { ACTION_ROUTES, navAllows } from "@/lib/permissions";

export type AdminRole = "super_admin" | "province_admin" | "hospital_admin";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: AdminRole;
  permissions: string[];
  nav: string[];
  must_change_password?: boolean;
  hospitalStaff?: {
    id: string;
    staffType: "treatment_admin" | "center_admin";
    treatmentCenter: string;
    province: string;
  } | null;
  provinceAdmin?: { id: string; province: string; provinceId?: number } | null;
  scope?: { kind: string; provinceId?: number | null; hospitalId?: number | null };
};

const USER_KEY = "nhms-admin-user";

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
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function persistUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAdminUser(user: AuthUser | null): user is AuthUser {
  return Boolean(user && user.role !== ("patient" as string));
}

export function pathAllowed(pathname: string, user: AuthUser) {
  if (!isAdminUser(user)) return false;
  const action = ACTION_ROUTES.find((route) => route.test(pathname));
  if (action) return user.permissions?.includes(action.permission) ?? false;
  if (pathname === "/dashboard") return user.permissions?.includes("dashboard") ?? user.nav?.includes("/dashboard") ?? false;
  return navAllows(pathname, user.nav ?? []);
}

export function homeForUser(user: AuthUser) {
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
      .catch(() => {
        clearAccessToken();
        localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

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
        localStorage.removeItem(USER_KEY);
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
    if (!getAccessToken() || !user) {
      router.replace("/login");
      return;
    }
    if (!canOpen(pathname)) {
      router.replace(homeForUser(user));
    }
  }, [loading, user, pathname, canOpen, router]);

  if (loading) {
    return <p className="p-6 text-[12px] text-muted">Checking access…</p>;
  }
  if (!user) return null;
  return <>{children}</>;
}
