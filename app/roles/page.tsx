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
  ApiError,
  api,
  getMe,
  getPaginationTotal,
  type ApiResponse,
} from "@/lib/api";
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

type Role = {
  id: string;
  name: string;
  description: string;
  status: boolean;
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [query, setQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [selected, setSelected] = useState<Role | null>(null);
  const [editing, setEditing] = useState<Role | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    void getMe()
      .then((user) => setCurrentUserRole(user.role))
      .catch(() => setCurrentUserRole(null));
  }, []);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
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
      setRoles(items.map(normalizeRole));
      setTotal(
        getPaginationTotal(
          response.metadata,
          Array.isArray(response.data)
            ? items.length
            : (response.data.total ??
                response.data.total_count ??
                items.length),
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load roles.",
      );
      setRoles([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, query, sortAsc]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRoles(), 250);
    return () => window.clearTimeout(timer);
  }, [loadRoles]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  }

  function openEdit(role: Role) {
    setEditing(role);
    setForm({
      name: role.name,
      description: role.description,
      status: role.status,
    });
    setFormOpen(true);
  }

  async function openDetail(role: Role) {
    try {
      const response = await api.get<ApiResponse<RoleApi>>(
        `/roles/${role.id}/detail`,
      );
      setSelected(normalizeRole(response.data));
    } catch (requestError) {
      setSelected(role);
      showError(
        "Unable to load role details",
        requestError instanceof Error ? requestError.message : undefined,
      );
    }
  }

  async function saveRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentUserRole !== "ADMIN") return;
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
      await loadRoles();
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
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/roles/${deleteTarget.id}/delete`);
      setDeleteTarget(null);
      setSelected(null);
      showSuccess("Role deleted");
      await loadRoles();
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
    if (currentUserRole !== "ADMIN") return;

    setUpdatingStatusId(role.id);
    try {
      await api.patch(`/roles/${role.id}/status`, { status });
      setRoles((currentRoles) =>
        currentRoles.map((item) =>
          item.id === role.id ? { ...item, status } : item,
        ),
      );
      if (selected?.id === role.id) {
        setSelected({ ...selected, status });
      }
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

  if (currentUserRole !== "ADMIN" && currentUserRole !== null) {
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage application roles and their availability.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={openCreate}>
          <Plus /> Add role
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
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
                  roles.map((role) => (
                    <TableRow key={role.id}>
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
                              role.name.toUpperCase() === "ADMIN" ||
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
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="View role"
                            onClick={() => void openDetail(role)}
                          >
                            <Eye />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Edit role"
                            onClick={() => openEdit(role)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete role"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(role)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && !roles.length && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
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
                <Button
                  variant="destructive"
                  onClick={() => setDeleteTarget(selected)}
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
                  <Pencil /> Edit role
                </Button>
              </DialogFooter>
            </div>
          )}
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
