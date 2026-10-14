"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
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
  Spinner,
  Switch,
  Skeleton,
  SelectMenu,
} from "@/components/ui";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  getPaginationRange,
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
import { AccessDenied } from "@/components/access-denied";
import {
  ApiError,
  api,
  getPaginationTotal,
  type ApiResponse,
} from "@/lib/api";

type UserRole = string;
type User = {
  id: string;
  email: string;
  role: UserRole;
  role_id?: string | number;
  status: boolean;
  created_at?: string;
};
type UserForm = {
  email: string;
  password: string;
  roleId: string;
  status: boolean;
};
type UserListPayload = {
  items?: User[];
  results?: User[];
  users?: User[];
  total?: number;
  total_count?: number;
  page?: number;
  per_page?: number;
  last_page?: number;
};
type UserListData = { users: User[]; total: number };
type RoleRecord = {
  id?: string | number;
  role_id?: string | number;
  name?: string;
  role_name?: string;
  label?: string;
};
type RoleOption = { id: string; name: string };
type RoleListData =
  RoleRecord[] | { items?: RoleRecord[]; roles?: RoleRecord[] };

const emptyForm: UserForm = {
  email: "",
  password: "",
  roleId: "",
  status: true,
};

const userStatusFilterOptions = [
  { value: "all", label: "All status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

function normalizeRoleOption(role: RoleRecord): RoleOption | null {
  const id = role.id ?? role.role_id;
  const name = role.name ?? role.role_name ?? role.label;
  if (id === undefined || id === null || !name) return null;
  return { id: String(id), name: String(name) };
}

function getRoleItems(data: RoleListData): RoleRecord[] {
  return Array.isArray(data) ? data : (data.items ?? data.roles ?? []);
}

function toRoleId(value: string) {
  return /^\d+$/.test(value) ? Number(value) : value;
}

const avatarColors = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
];

function getAvatarColor(email: string) {
  const hash = Array.from(email.toLowerCase()).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return avatarColors[hash % avatarColors.length];
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
    >
      <span
        className={`size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-muted-foreground"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function getListData(response: ApiResponse<User[] | UserListPayload>) {
  const payload = response.data;
  if (Array.isArray(payload)) {
    return {
      users: payload,
      total: getPaginationTotal(response.metadata, payload.length),
    };
  }
  return {
    users: payload.items ?? payload.results ?? payload.users ?? [],
    total: getPaginationTotal(
      response.metadata,
      payload.total ?? payload.total_count ?? 0,
    ),
  };
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { can, loading: authLoading, user: currentUser } = useAuth();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [, setActionError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const pageSize = 10;
  const sortOrder = sortAsc ? "ASC" : "DESC";
  const usersQueryKey = [
    "users",
    page,
    query,
    roleFilter,
    statusFilter,
    sortOrder,
  ];

  const rolesQuery = useQuery({
    queryKey: ["available-roles"],
    enabled: !authLoading && can("user.read"),
    queryFn: async () => {
      const response = await api.get<ApiResponse<RoleListData>>(
        "/users/get-all-roles",
      );
      const roles = getRoleItems(response.data)
        .map(normalizeRoleOption)
        .filter((role): role is RoleOption => role !== null);
      return Array.from(new Map(roles.map((role) => [role.id, role])).values());
    },
  });

  const usersQuery = useQuery({
    enabled: !authLoading && can("user.read"),
    queryKey: usersQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(pageSize),
        sort_by: "email",
        sort_order: sortOrder,
      });
      if (query.trim()) params.set("q", query.trim());
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (statusFilter !== "all")
        params.set("status", statusFilter === "active" ? "true" : "false");

      const response = await api.get<ApiResponse<User[] | UserListPayload>>(
        `/users?${params.toString()}`,
      );
      return getListData(response);
    },
  });

  const users = usersQuery.data?.users ?? [];
  const total = usersQuery.data?.total ?? 0;
  const currentUserId = currentUser?.id ?? null;
  const currentUserEmail = currentUser?.email.toLowerCase() ?? null;
  const loading = usersQuery.isLoading;
  const error = usersQuery.error
    ? usersQuery.error instanceof ApiError
      ? usersQuery.error.message
      : "Unable to load users."
    : "";
  const availableRoles = rolesQuery.data ?? [];
  const rolesLoading = rolesQuery.isLoading;

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginationPages = getPaginationRange(currentPage, pageCount);

  function resetAndSearch(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function resolveRoleId(user: User) {
    if (user.role_id !== undefined && user.role_id !== null) {
      return String(user.role_id);
    }
    const match = availableRoles.find(
      (role) => role.name.toLowerCase() === user.role?.toLowerCase(),
    );
    return match?.id ?? "";
  }

  function openCreate() {
    if (!can("user.create")) return;
    setEditing(null);
    setForm({
      ...emptyForm,
      roleId: availableRoles[0]?.id ?? "",
    });
    setActionError("");
    setFormOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({
      email: user.email,
      password: "",
      roleId: resolveRoleId(user),
      status: user.status,
    });
    setActionError("");
    setFormOpen(true);
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingUser) return;
    setActionError("");
    if (!editing && !can("user.create")) {
      setActionError("You do not have permission to create users.");
      return;
    }
    const selectedRole = availableRoles.find((role) => role.id === form.roleId);
    if (!selectedRole) {
      setActionError("Select a role for this user.");
      showError("Unable to save user", "Select a role for this user.");
      return;
    }
    setSavingUser(true);
    try {
      const payload: Record<string, string | number | boolean> = {
        email: form.email.trim(),
        role_id: toRoleId(selectedRole.id),
        status: form.status,
      };
      if (form.password) payload.password = form.password;
      if (editing) {
        if (statusLocked) payload.status = editing.status;
        await api.put(`/users/${editing.id}/update`, payload);
      } else {
        await api.post("/users/create", payload);
      }
      setFormOpen(false);
      showSuccess(editing ? "User updated" : "User created");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to save user.",
      );
      showError(
        "Unable to save user",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setSavingUser(false);
    }
  }

  async function toggleStatus(user: User, nextStatus: boolean) {
    if (updatingStatusIds.has(user.id)) return;
    setActionError("");
    if (
      user.id === currentUserId ||
      user.email.toLowerCase() === currentUserEmail
    ) {
      setActionError("You cannot change your own account status.");
      return;
    }

    setUpdatingStatusIds((current) => new Set(current).add(user.id));
    const previous = queryClient.getQueryData<UserListData>(usersQueryKey);
    queryClient.setQueryData<UserListData>(usersQueryKey, (current) =>
      current
        ? {
            ...current,
            users: current.users.map((item) =>
              item.id === user.id ? { ...item, status: nextStatus } : item,
            ),
          }
        : current,
    );
    try {
      await api.patch(`/users/${user.id}/status`, { status: nextStatus });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("User status updated");
      if (selected?.id === user.id)
        setSelected({ ...user, status: nextStatus });
    } catch (requestError) {
      if (previous) queryClient.setQueryData(usersQueryKey, previous);
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to update user status.",
      );
      showError(
        "Unable to update user status",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setUpdatingStatusIds((current) => {
        const next = new Set(current);
        next.delete(user.id);
        return next;
      });
    }
  }

  async function deleteUser(user: User) {
    setActionError("");
    setDeleting(true);
    try {
      await api.delete(`/users/${user.id}/delete`);
      setSelected(null);
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      showSuccess("User deleted");
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to delete user.",
      );
      showError(
        "Unable to delete user",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setDeleting(false);
    }
  }

  if (authLoading) return null;
  if (!can("user.read")) {
    return <AccessDenied />;
  }

  const isEditingAdmin = editing?.role?.toUpperCase() === "ADMIN";
  const isEditingSelf = Boolean(
    editing &&
    (editing.id === currentUserId ||
      editing.email.toLowerCase() === currentUserEmail),
  );
  const statusLocked = isEditingAdmin || isEditingSelf;

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage login accounts, roles, and access status.
          </p>
        </div>
        {can("user.create") && (
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Plus /> Add user
          </Button>
        )}
      </section>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>User directory</CardTitle>
            <CardDescription>
              Search and manage login accounts in your organization.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) =>
                  resetAndSearch(setQuery, event.target.value)
                }
                placeholder="Search by email..."
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal /> Filters
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
            <Table className="min-w-[920px] overflow-hidden rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16">No.</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
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
                  users.map((user, index) => {
                    const isCurrentUser =
                      user.id === currentUserId ||
                      user.email.toLowerCase() === currentUserEmail;

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="text-muted-foreground">
                          {(currentPage - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className="flex items-center gap-3 text-left"
                            onClick={() => setSelected(user)}
                          >
                            <span className="font-medium hover:underline">
                              {user.email}
                            </span>
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.status}
                            disabled={
                              isCurrentUser || updatingStatusIds.has(user.id)
                            }
                            onCheckedChange={(checked) =>
                              void toggleStatus(user, checked)
                            }
                            aria-label={
                              isCurrentUser
                                ? "Your status cannot be changed"
                                : `Turn status ${user.status ? "off" : "on"}`
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="View details"
                              onClick={() => setSelected(user)}
                            >
                              <Eye />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Edit user"
                              onClick={() => openEdit(user)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Delete user"
                              onClick={() => setDeleteTarget(user)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                {!loading && !users.length && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No users found. Try changing your search or filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {total ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, total)} of {total} users
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
                    disabled={currentPage === 1}
                  />
                </PaginationItem>
                {paginationPages.map((item, index) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
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
                    disabled={currentPage === pageCount}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter users</DialogTitle>
            <DialogDescription>
              Refine the user list by role, status, or email sorting.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <label htmlFor="user-role-filter" className="text-sm font-medium">
                Role
              </label>
              <SelectMenu
                id="user-role-filter"
                value={roleFilter}
                options={[
                  { value: "all", label: "All roles" },
                  ...availableRoles.map((role) => ({
                    value: role.name,
                    label: role.name,
                  })),
                ]}
                onChange={(value) => {
                  setRoleFilter(value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="user-status-filter"
                className="text-sm font-medium"
              >
                Status
              </label>
              <SelectMenu
                id="user-status-filter"
                value={statusFilter}
                options={userStatusFilterOptions}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Sort by email</span>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSortAsc((value) => !value)}
              >
                {sortAsc ? <ArrowDown /> : <ArrowUp />}{" "}
                {sortAsc ? "Ascending" : "Descending"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRoleFilter("all");
                setStatusFilter("all");
                setSortAsc(true);
                setPage(1);
              }}
            >
              Reset filters
            </Button>
            <DialogClose render={<Button type="button" />}>
              Apply filters
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>
              Login account and access information.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-12 items-center justify-center rounded-full font-semibold ${getAvatarColor(selected.email)}`}
                >
                  {selected.email[0]?.toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold">{selected.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.role}
                  </p>
                </div>
                <div className="ml-auto">
                  <StatusBadge active={selected.status} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteTarget(selected)}
                  disabled={deleting}
                >
                  <Trash2 /> Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelected(null);
                    openEdit(selected);
                  }}
                >
                  <Pencil /> Edit user
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The account{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.email}
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
              onClick={() => deleteTarget && void deleteUser(deleteTarget)}
            >
              <Trash2 /> {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update account access below."
                : "Create a login account for a user."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">
                Password{" "}
                {editing && (
                  <span className="font-normal text-muted-foreground">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                id="user-password"
                type="password"
                minLength={8}
                required={!editing}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <select
                id="user-role"
                value={form.roleId}
                onChange={(event) =>
                  setForm({ ...form, roleId: event.target.value })
                }
                disabled={rolesLoading}
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {rolesLoading && <option>Loading roles...</option>}
                {!rolesLoading && !availableRoles.length && (
                  <option value="">No roles available</option>
                )}
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
                {form.roleId &&
                  !availableRoles.some((role) => role.id === form.roleId) && (
                    <option value={form.roleId}>
                      {editing?.role ?? form.roleId}
                    </option>
                  )}
              </select>
            </div>
            <label
              className={`flex items-center gap-2 text-sm${
                statusLocked ? " cursor-not-allowed opacity-60" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={form.status}
                disabled={statusLocked}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.checked })
                }
                className="size-4 accent-primary disabled:cursor-not-allowed"
              />{" "}
              Active account
              {isEditingAdmin && (
                <span className="font-normal text-muted-foreground">
                  (admin account always active)
                </span>
              )}
              {!isEditingAdmin && isEditingSelf && (
                <span className="font-normal text-muted-foreground">
                  (you cannot deactivate your own account)
                </span>
              )}
            </label>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline" disabled={savingUser} />}
              >
                Cancel
              </DialogClose>
              <Button type="submit" disabled={savingUser}>
                {savingUser && <Spinner />}
                {savingUser
                  ? editing
                    ? "Saving..."
                    : "Creating user..."
                  : editing
                    ? "Save changes"
                    : "Add user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
