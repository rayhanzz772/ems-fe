import type { AuthUser } from "@/lib/api";

export const PERMISSIONS = [
  "dashboard.read", "user.read", "user.create", "user.update", "user.delete",
  "role.read", "role.create", "role.update", "role.delete", "role.permission.assign",
  "department.read", "department.create", "department.update", "department.delete",
  "branch.read", "branch.create", "branch.update", "branch.delete",
  "position.read", "position.create", "position.update", "position.delete",
  "leave_type.read", "leave_type.create", "leave_type.update", "leave_type.delete",
  "leave_request.read", "leave_request.create", "leave_request.update",
  "leave_request.delete", "leave_request.decide",
  "leave_balance.read", "leave_balance.create", "leave_balance.update", "leave_balance.delete",
  "employee.read", "employee.create", "employee.update", "employee.delete", "employee.export",
  "audit_log.read", "audit_log.export",
] as const;

const rolePermissions: Record<string, readonly string[]> = {
  ADMIN: ["*"],
  HR: ["dashboard.read", "employee.read", "employee.create", "employee.update", "employee.export", "department.read", "user.read", "audit_log.read", "leave_type.read", "leave_request.read", "leave_request.create", "leave_request.update", "leave_request.delete", "leave_request.decide", "leave_balance.read"],
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
