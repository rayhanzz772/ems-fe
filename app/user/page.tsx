"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Pencil,
  Plus,
  Search,
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
  Switch,
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
import {
  ApiError,
  api,
  getMe,
  getPaginationTotal,
  type ApiResponse,
} from "@/lib/api";

type UserRole = "ADMIN" | "HR";
type User = {
  id: string;
  email: string;
  role: UserRole;
  status: boolean;
  created_at?: string;
};
type UserForm = {
  email: string;
  password: string;
  role: UserRole;
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

const emptyForm: UserForm = {
  email: "",
  password: "",
  role: "HR",
  status: true,
};

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
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const pageSize = 10;
  const sortOrder = sortAsc ? "ASC" : "DESC";

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
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
      const result = getListData(response);
      setUsers(result.users);
      setTotal(result.total);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, query, roleFilter, sortOrder, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void getMe()
        .then((user) => {
          setCurrentUserId(user.id);
          setCurrentUserEmail(user.email.toLowerCase());
          setCurrentUserRole(user.role);
        })
        .catch(() => {
          setCurrentUserId(null);
          setCurrentUserEmail(null);
          setCurrentUserRole(null);
        });
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);

  function resetAndSearch(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function openCreate() {
    if (currentUserRole !== "ADMIN") return;
    setEditing(null);
    setForm(emptyForm);
    setActionError("");
    setFormOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    setActionError("");
    setFormOpen(true);
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    if (!editing && currentUserRole !== "ADMIN") {
      setActionError("Only administrators can create users.");
      return;
    }
    try {
      const payload: Record<string, string | boolean> = {
        email: form.email,
        role: form.role,
        status: form.status,
      };
      if (form.password) payload.password = form.password;
      if (editing) {
        await api.put(`/users/${editing.id}/update`, payload);
      } else {
        await api.post("/users/create", payload);
      }
      setFormOpen(false);
      await loadUsers();
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to save user.",
      );
    }
  }

  async function toggleStatus(user: User, nextStatus: boolean) {
    setActionError("");
    if (
      user.id === currentUserId ||
      user.email.toLowerCase() === currentUserEmail
    ) {
      setActionError("You cannot change your own account status.");
      return;
    }

    try {
      await api.patch(`/users/${user.id}/status`, { status: nextStatus });
      await loadUsers();
      if (selected?.id === user.id)
        setSelected({ ...user, status: nextStatus });
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to update user status.",
      );
    }
  }

  async function deleteUser(user: User) {
    setActionError("");
    try {
      await api.delete(`/users/${user.id}/delete`);
      setSelected(null);
      await loadUsers();
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to delete user.",
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Workspace / Administration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage login accounts, roles, and access status.
          </p>
        </div>
        {currentUserRole === "ADMIN" && (
          <Button onClick={openCreate}>
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
          <div className="flex flex-col gap-3 lg:flex-row">
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
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(event) =>
                  resetAndSearch(setRoleFilter, event.target.value)
                }
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All roles</option>
                <option value="ADMIN">Admin</option>
                <option value="HR">HR</option>
              </select>
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) =>
                  resetAndSearch(setStatusFilter, event.target.value)
                }
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button
                variant="outline"
                size="icon"
                title="Toggle sort by email"
                onClick={() => {
                  setSortAsc((value) => !value);
                  setPage(1);
                }}
              >
                {sortAsc ? <ArrowDown /> : <ArrowUp />}
              </Button>
            </div>
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
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Loading users...
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  users.map((user) => {
                    const isCurrentUser =
                      user.id === currentUserId ||
                      user.email.toLowerCase() === currentUserEmail;

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <button
                            type="button"
                            className="flex items-center gap-3 text-left"
                            onClick={() => setSelected(user)}
                          >
                            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {user.email[0]?.toUpperCase()}
                            </span>
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
                            disabled={isCurrentUser}
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
                              onClick={() => void deleteUser(user)}
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
                      colSpan={4}
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

      {actionError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {actionError}
        </p>
      )}

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
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
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
                  onClick={() => void deleteUser(selected)}
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
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as UserRole })
                }
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="ADMIN">Admin</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.checked })
                }
                className="size-4 accent-primary"
              />{" "}
              Active account
            </label>
            {actionError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {actionError}
              </p>
            )}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit">
                {editing ? "Save changes" : "Add user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
