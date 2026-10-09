"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  KeyRound,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { ApiError, api, getPaginationTotal, type ApiResponse } from "@/lib/api";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Skeleton,
  Switch,
  Textarea,
} from "@/components/ui";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showError, showSuccess } from "@/lib/toast";
import { useAuth } from "@/hooks/use-auth";

type Role = {
  id: string;
  name: string;
  description: string;
  status: boolean;
};

type Permission = {
  id: string;
  key: string;
  resource: string;
  action: string;
  description: string;
};

type RoleApi = Omit<Role, "id"> & { id: string | number };
type RoleListData =
  | RoleApi[]
  | {
      items?: RoleApi[];
      results?: RoleApi[];
      roles?: RoleApi[];
      total?: number;
      total_count?: number;
    };

const emptyForm = { name: "", description: "", status: true };

function normalizeRole(role: RoleApi): Role {
  return {
    id: String(role.id),
    name: role.name,
    description: role.description ?? "",
    status: role.status ?? true,
  };
}

function isAdminRole(role: Role | null) {
  return role?.name.trim().toUpperCase() === "ADMIN";
}

function normalizePermission(permission: {
  id: string | number;
  key?: string;
  resource?: string;
  action?: string;
  description?: string;
}) {
  const key = permission.key ?? String(permission.id);
  const [resource = key, action = ""] = key.split(".");
  return {
    id: String(permission.id),
    key,
    resource: permission.resource ?? resource,
    action: permission.action ?? action,
    description: permission.description ?? "",
  };
}

function getPermissionItems(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (typeof data !== "object" || data === null) return [];
  const payload = data as { items?: unknown[]; permissions?: unknown[] };
  return payload.permissions ?? payload.items ?? [];
}

function isPermissionRecord(item: unknown): item is {
  id: string | number;
  key?: string;
  resource?: string;
  action?: string;
  description?: string;
} {
  return (
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    (typeof item.id === "string" || typeof item.id === "number")
  );
}

function getRoleItems(data: RoleListData) {
  return Array.isArray(data)
    ? data
    : (data.items ?? data.results ?? data.roles ?? []);
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-muted-foreground"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { can, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Role | null>(null);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [permissionTarget, setPermissionTarget] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsSaving, setPermissionsSaving] = useState(false);
  const pageSize = 10;

  const rolesQuery = useQuery({
    queryKey: ["roles", page, query, sortAsc],
    enabled: !authLoading && can("role.read"),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(pageSize),
        sort_by: "name",
        sort_order: sortAsc ? "ASC" : "DESC",
      });
      if (query.trim()) params.set("q", query.trim());
      const response = await api.get<ApiResponse<RoleListData>>(
        `/roles?${params}`,
      );
      const items = getRoleItems(response.data);
      return {
        roles: items.map(normalizeRole),
        total: getPaginationTotal(
          response.metadata,
          Array.isArray(response.data)
            ? items.length
            : (response.data.total ??
                response.data.total_count ??
                items.length),
        ),
      };
    },
  });

  const roles = rolesQuery.data?.roles ?? [];
  const total = rolesQuery.data?.total ?? 0;
  const loading = rolesQuery.isLoading;
  const error = rolesQuery.error
    ? rolesQuery.error instanceof ApiError
      ? rolesQuery.error.message
      : "Unable to load roles."
    : "";

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);

  function openCreate() {
    if (!can("role.create")) return;
    setEditing(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  }

  function openEdit(role: Role) {
    if (isAdminRole(role) || !can("role.update")) return;
    setEditing(role);
    setForm({
      name: role.name,
      description: role.description,
      status: role.status,
    });
    setFormOpen(true);
  }

  async function openDetail(role: Role) {
    setSelected(role);
  }

  async function openPermissionEditor(role: Role) {
    if (role.name.toUpperCase() === "ADMIN" || !can("role.permission.assign")) {
      return;
    }
    setPermissionTarget(role);
    setPermissionsLoading(true);
    try {
      const [catalogResponse, assignedResponse] = await Promise.all([
        api.get<ApiResponse<unknown>>("/permissions"),
        api.get<ApiResponse<unknown>>(`/roles/${role.id}/permissions`),
      ]);
      const catalog = getPermissionItems(catalogResponse.data)
        .filter(isPermissionRecord)
        .map(normalizePermission);
      const assigned = getPermissionItems(assignedResponse.data)
        .filter(isPermissionRecord)
        .map(normalizePermission);
      setPermissions(catalog);
      setSelectedPermissionIds(assigned.map((permission) => permission.id));
    } catch (requestError) {
      setPermissionTarget(null);
      showError(
        "Unable to load permissions",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setPermissionsLoading(false);
    }
  }

  async function savePermissions() {
    if (
      !permissionTarget ||
      permissionTarget.name.toUpperCase() === "ADMIN" ||
      !can("role.permission.assign")
    ) {
      return;
    }
    const permissionIds = selectedPermissionIds.filter((id) =>
      permissions.some((permission) => permission.id === id),
    );
    setPermissionsSaving(true);
    try {
      await api.put(`/roles/${permissionTarget.id}/permissions`, {
        permission_ids: permissionIds,
      });
      setPermissionTarget(null);
      showSuccess("Role permissions updated");
    } catch (requestError) {
      showError(
        "Unable to update permissions",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setPermissionsSaving(false);
    }
  }

  async function saveRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!can(editing ? "role.update" : "role.create")) return;
    setSaving(true);
    try {
      const values = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
      };
      if (editing) {
        await api.put(`/roles/${editing.id}/update`, values);
      } else {
        await api.post("/roles/create", values);
      }
      setFormOpen(false);
      showSuccess(editing ? "Role updated" : "Role created");
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
    } catch (requestError) {
      showError(
        "Unable to save role",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRole() {
    if (!deleteTarget || isAdminRole(deleteTarget) || !can("role.delete")) {
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/roles/${deleteTarget.id}/delete`);
      setDeleteTarget(null);
      setSelected(null);
      showSuccess("Role deleted");
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
    } catch (requestError) {
      showError(
        "Unable to delete role",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setDeleting(false);
    }
  }

  async function toggleStatus(role: Role, status: boolean) {
    if (!can("role.update")) return;

    setUpdatingStatusId(role.id);
    try {
      await api.patch(`/roles/${role.id}/status`, undefined);
      if (selected?.id === role.id) {
        setSelected({ ...selected, status });
      }
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      showSuccess(`Role ${status ? "activated" : "deactivated"}`);
    } catch (requestError) {
      showError(
        "Unable to update role status",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  if (authLoading) return null;
  if (!can("role.read")) {
    return (
      <main className="mx-auto w-full max-w-5xl p-5 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              Only administrators can manage roles.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage application roles and their availability.
          </p>
        </div>
        {can("role.create") && (
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Plus /> Add role
          </Button>
        )}
      </section>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>Role list</CardTitle>
            <CardDescription>View and manage access roles.</CardDescription>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search roles..."
                className="w-full pl-9"
              />
            </div>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setSortAsc((value) => !value)}
            >
              {sortAsc ? <ArrowUp /> : <ArrowDown />} Name
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <p className="mx-4 mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="overflow-x-auto px-4">
            <Table className="min-w-[760px] overflow-hidden rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16">No.</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading &&
                  Array.from({ length: 4 }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-5 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-64" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-20" />
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading &&
                  roles.map((role, index) => (
                    <TableRow key={role.id}>
                      <TableCell className="text-muted-foreground">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>
                        <button
                          className="font-semibold hover:underline"
                          onClick={() => void openDetail(role)}
                        >
                          {role.name}
                        </button>
                      </TableCell>
                      <TableCell className="max-w-sm truncate text-muted-foreground">
                        {role.description || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={role.status}
                            disabled={
                              !can("role.update") ||
                              isAdminRole(role) ||
                              updatingStatusId === role.id
                            }
                            onCheckedChange={(status) =>
                              void toggleStatus(role, status)
                            }
                            aria-label={`Set ${role.name} ${
                              role.status ? "inactive" : "active"
                            }`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {can("role.update") && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="View role"
                              onClick={() => void openDetail(role)}
                            >
                              <Eye />
                            </Button>
                          )}
                          {can("role.permission.assign") && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Manage permissions"
                              disabled={isAdminRole(role)}
                              onClick={() => void openPermissionEditor(role)}
                            >
                              <KeyRound />
                            </Button>
                          )}
                          {can("role.update") && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Edit role"
                              disabled={isAdminRole(role)}
                              onClick={() => openEdit(role)}
                            >
                              <Pencil />
                            </Button>
                          )}
                          {can("role.delete") && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Delete role"
                              className="text-destructive hover:text-destructive"
                              disabled={isAdminRole(role)}
                              onClick={() => setDeleteTarget(role)}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && !roles.length && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No roles found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {total ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min((currentPage - 1) * pageSize + roles.length, total)} of{" "}
              {total} roles
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage(Math.max(1, currentPage - 1));
                    }}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (item) => (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={item === currentPage}
                        onClick={(event) => {
                          event.preventDefault();
                          setPage(item);
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setPage(Math.min(pageCount, currentPage + 1));
                    }}
                    className={
                      currentPage === pageCount
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Role details</DialogTitle>
            <DialogDescription>Information about this role.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="mt-1 font-semibold">{selected.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Description</p>
                <p className="mt-1">{selected.description || "—"}</p>
              </div>
              <StatusBadge active={selected.status} />
              <DialogFooter>
                {can("role.delete") && (
                  <Button
                    variant="destructive"
                    disabled={isAdminRole(selected)}
                    onClick={() => setDeleteTarget(selected)}
                  >
                    <Trash2 /> Delete
                  </Button>
                )}
                {can("role.update") && (
                  <Button
                    variant="outline"
                    disabled={isAdminRole(selected)}
                    onClick={() => {
                      setSelected(null);
                      openEdit(selected);
                    }}
                  >
                    <Pencil /> Edit role
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(permissionTarget)}
        onOpenChange={(open) =>
          !open && !permissionsSaving && setPermissionTarget(null)
        }
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage permissions</DialogTitle>
            <DialogDescription>
              Select the permissions granted to {permissionTarget?.name}.
            </DialogDescription>
          </DialogHeader>
          {permissionsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : permissions.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No permissions are available in the permission catalog.
            </p>
          ) : (
            <div className="grid max-h-[55vh] gap-2 overflow-y-auto sm:grid-cols-2">
              {permissions.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-start gap-3 rounded-md border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissionIds.includes(permission.id)}
                    onChange={(event) =>
                      setSelectedPermissionIds((current) =>
                        event.target.checked
                          ? [...current, permission.id]
                          : current.filter((id) => id !== permission.id),
                      )
                    }
                  />
                  <span>
                    <span className="block font-medium">{permission.key}</span>
                    <span className="text-muted-foreground">
                      {permission.description ||
                        `${permission.resource} · ${permission.action}`}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={permissionsSaving} />}
            >
              Cancel
            </DialogClose>
            <Button
              onClick={() => void savePermissions()}
              disabled={permissionsLoading || permissionsSaving}
            >
              {permissionsSaving ? "Saving..." : "Save permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit role" : "Add role"}</DialogTitle>
            <DialogDescription>
              Define the role name, description, and status.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveRole} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </div>
            <label className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>Active role</span>
              <Switch
                checked={form.status}
                onCheckedChange={(status) => setForm({ ...form, status })}
              />
            </label>
            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline" disabled={saving} />
                }
              >
                Cancel
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Update role" : "Create role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete role?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The role{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={deleting} />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void deleteRole()}
            >
              <Trash2 /> {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
