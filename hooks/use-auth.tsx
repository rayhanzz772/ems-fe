"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getMe, logout as apiLogout, type AuthUser } from "@/lib/api";
import { canPermission, getPermissions } from "@/lib/rbac";

type AuthContextValue = {
  user: AuthUser | null;
  permissions: readonly string[];
  loading: boolean;
  can: (permission: string) => boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setUser(await getMe());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(handle);
  }, []);

  const value = useMemo(
    () => ({
      user,
      permissions: getPermissions(user),
      loading,
      can: (permission: string) => canPermission(user, permission),
      refresh,
      logout: async () => {
        await apiLogout();
        setUser(null);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
