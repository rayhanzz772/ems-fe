"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    queryClient.clear();
    setLoading(true);
    try {
      const currentUser = await getMe();
      if (currentRequestId === requestId.current) setUser(currentUser);
    } catch {
      if (currentRequestId === requestId.current) setUser(null);
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    const handle = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(handle);
  }, [refresh]);

  const logout = useCallback(async () => {
    requestId.current += 1;
    setUser(null);
    setLoading(false);
    queryClient.clear();
    await apiLogout();
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user,
      permissions: getPermissions(user),
      loading,
      can: (permission: string) => canPermission(user, permission),
      refresh,
      logout,
    }),
    [loading, logout, refresh, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
