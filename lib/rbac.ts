import type { AuthUser } from "@/lib/api";

export const PERMISSIONS = [
  "dashboard.read", "user.read", "user.create", "user.update", "user.delete",
  "role.read", "role.create", "role.update", "role.delete", "role.permission.assign",
  "department.read", "department.create", "department.update", "department.delete",
  "employee.read", "employee.create", "employee.update", "employee.delete", "employee.export",
  "audit_log.read", "audit_log.export",
] as const;

const rolePermissions: Record<string, readonly string[]> = {
  ADMIN: ["*"],
  HR: ["dashboard.read", "employee.read", "employee.create", "employee.update", "employee.export", "department.read", "user.read", "audit_log.read"],
  EMPLOYEE: ["dashboard.read", "employee.read"],
};

export function getPermissions(user: AuthUser | null) {
  if (!user) return [];
  return user.permissions ?? rolePermissions[user.role] ?? [];
}

export function canPermission(user: AuthUser | null, permission: string) {
  const permissions = getPermissions(user);
  return permissions.includes("*") || permissions.includes(permission);
}
