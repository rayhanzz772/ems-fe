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
  Switch,
  Skeleton,
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

type Department = {
  id: string;
  name: string;
  description: string;
  employeeCount: number;
  status?: boolean;
};

type DepartmentApi = {
  id: string | number;
  name: string;
  description?: string | null;
  employee_count?: number;
  employeeCount?: number;
  _count?: { employees?: number };
  status: boolean;
};

type DepartmentListData =
  | DepartmentApi[]
  | {
      items?: DepartmentApi[];
      results?: DepartmentApi[];
      departments?: DepartmentApi[];
      total?: number;
      total_count?: number;
      status: boolean;
    };

function normalizeDepartment(value: DepartmentApi): Department {
  return {
    id: String(value.id),
    name: value.name,
    description: value.description ?? "",
    employeeCount:
      value.employee_count ??
      value.employeeCount ??
      value._count?.employees ??
      0,
    status: value.status ?? true,
  };
}

const emptyDepartment = { name: "", description: "" };

const avatarColors = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
];

function getAvatarColor(name: string) {
  const hash = Array.from(name.toLowerCase()).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return avatarColors[hash % avatarColors.length];
}

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Department | null>(null);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(emptyDepartment);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 5;

  useEffect(() => {
    void getMe()
      .then((user) => setCurrentUserRole(user.role))
      .catch(() => setCurrentUserRole(null));
  }, []);

  const loadDepartments = useCallback(async () => {
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
      const response = await api.get<ApiResponse<DepartmentListData>>(
        `/departments?${params.toString()}`,
      );
      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : (data.items ?? data.results ?? data.departments ?? []);
      setDepartments(items.map(normalizeDepartment));
      setTotal(
        getPaginationTotal(
          response.metadata,
          Array.isArray(data)
            ? items.length
            : (data.total ?? data.total_count ?? items.length),
        ),
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load departments.",
      );
      setDepartments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, query, sortAsc]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDepartments(), 250);
    return () => window.clearTimeout(timer);
  }, [loadDepartments]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleDepartments = departments;

  function openCreate() {
    if (currentUserRole !== "ADMIN") return;
    setEditing(null);
    setForm({ ...emptyDepartment });
    setDeleteError("");
    setFormOpen(true);
  }

  function openEdit(department: Department) {
    setEditing(department);
    setForm({ name: department.name, description: department.description });
    setFormOpen(true);
  }

  async function openDetail(department: Department) {
    setDeleteError("");
    try {
      const response = await api.get<ApiResponse<DepartmentApi>>(
        `/departments/${department.id}/detail`,
      );
      setSelected(normalizeDepartment(response.data));
    } catch (requestError) {
      setSelected(department);
      setDeleteError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load department details.",
      );
    }
  }

  async function saveDepartment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteError("");
    if (!editing && currentUserRole !== "ADMIN") {
      setDeleteError("Only administrators can create departments.");
      return;
    }
    const values = {
      name: form.name.trim(),
      description: form.description.trim(),
    };
    try {
      if (editing) {
        await api.put(`/departments/${editing.id}/update`, values);
      } else {
        await api.post("/departments/create", values);
      }
      setFormOpen(false);
      showSuccess(editing ? "Department updated" : "Department created");
      await loadDepartments();
    } catch (requestError) {
      setDeleteError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to save department.",
      );
      showError(
        "Unable to save department",
        requestError instanceof Error ? requestError.message : undefined,
      );
    }
  }

  async function deleteDepartment(department: Department) {
    setDeleteError("");
    setDeleting(true);
    try {
      await api.delete(`/departments/${department.id}/delete`);
      setSelected(null);
      setDeleteTarget(null);
      showSuccess("Department deleted");
      await loadDepartments();
    } catch (requestError) {
      setDeleteError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to delete department.",
      );
      showError(
        "Unable to delete department",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setDeleting(false);
    }
  }

  async function toggleStatus(department: Department) {
    if (currentUserRole !== "ADMIN") return;
    setDeleteError("");
    try {
      await api.patch(`/departments/${department.id}/status`, {
        status: !department.status,
      });
      showSuccess("Department status updated");
      await loadDepartments();
      if (selected?.id === department.id) {
        setSelected({ ...selected, status: !department.status });
      }
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to update department status.";
      setDeleteError(message);
      showError("Unable to update department status", message);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your company units and team structure.
          </p>
        </div>
        {currentUserRole === "ADMIN" && (
          <Button onClick={openCreate}>
            <Plus /> Add department
          </Button>
        )}
      </section>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>Department directory</CardTitle>
            <CardDescription>
              Search and manage the units in your organization.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by department name..."
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              title="Toggle sort by name"
              onClick={() => {
                setSortAsc((value) => !value);
                setPage(1);
              }}
            >
              {sortAsc ? <ArrowDown /> : <ArrowUp />}
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
                  <TableHead>Department</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="space-y-3">
                        {Array.from({ length: 4 }, (_, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Skeleton className="size-9 rounded-full" />
                            <Skeleton className="h-4 w-56" />
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {visibleDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-3 text-left"
                        onClick={() => void openDetail(department)}
                      >
                        <span
                          className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(department.name)}`}
                        >
                          {department.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="font-medium hover:underline">
                          {department.name}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {department.description || "—"}
                    </TableCell>
                    <TableCell>{department.employeeCount}</TableCell>
                    <TableCell>
                      <Switch
                        checked={department.status}
                        disabled={currentUserRole !== "ADMIN"}
                        onCheckedChange={() => void toggleStatus(department)}
                        aria-label={`Turn department status ${department.status ? "off" : "on"}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View details"
                          onClick={() => void openDetail(department)}
                        >
                          <Eye />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit department"
                          onClick={() => openEdit(department)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Delete department"
                          onClick={() => setDeleteTarget(department)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!visibleDepartments.length && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No departments found. Try changing your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {total ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(
                (currentPage - 1) * pageSize + departments.length,
                total,
              )}{" "}
              of {total} departments
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
            <DialogTitle>Department details</DialogTitle>
            <DialogDescription>
              Information about this department.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-12 items-center justify-center rounded-full font-semibold ${getAvatarColor(selected.name)}`}
                >
                  {selected.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.employeeCount} employees assigned
                  </p>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Description</p>
                <p className="mt-1 font-medium">
                  {selected.description || "—"}
                </p>
              </div>
              {deleteError && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {deleteError}
                </p>
              )}
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
                  <Pencil /> Edit department
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
            <DialogTitle>Delete department?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The department{" "}
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
              onClick={() =>
                deleteTarget && void deleteDepartment(deleteTarget)
              }
            >
              <Trash2 /> {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit department" : "Add department"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update department information below."
                : "Create a new organizational unit."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveDepartment} className="space-y-4">
            {deleteError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {deleteError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="department-name">Name</Label>
              <Input
                id="department-name"
                required
                minLength={1}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Engineering"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department-description">Description</Label>
              <Textarea
                id="department-description"
                maxLength={255}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Briefly describe this department"
                rows={4}
              />
              <p className="text-right text-xs text-muted-foreground">
                {form.description.length}/255
              </p>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit">
                {editing ? "Save changes" : "Add department"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
