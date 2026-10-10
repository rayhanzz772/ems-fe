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
  Trash2,
} from "lucide-react";
import {
  ApiError,
  api,
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
  Spinner,
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
import { useAuth } from "@/hooks/use-auth";
import { showError, showSuccess } from "@/lib/toast";

type Branch = {
  id: string;
  name: string;
  address: string;
  status: boolean;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
};

type BranchApi = {
  id: string | number;
  name?: string | null;
  address?: string | null;
  status?: boolean;
  employee_count?: number | string;
  created_at?: string;
  updated_at?: string;
};

type BranchListData =
  | BranchApi[]
  | {
      items?: BranchApi[];
      results?: BranchApi[];
      branches?: BranchApi[];
      total?: number;
      total_count?: number;
    };

type BranchSortField = "name" | "status" | "created_at" | "updated_at";

const emptyForm = { name: "", address: "" };
const pageSize = 10;

function normalizeBranch(value: BranchApi): Branch {
  const employeeCount = Number(value.employee_count ?? 0);

  return {
    id: String(value.id),
    name: value.name ?? "",
    address: value.address ?? "",
    status: value.status ?? true,
    employeeCount: Number.isFinite(employeeCount) ? employeeCount : 0,
    createdAt: value.created_at ?? "",
    updatedAt: value.updated_at ?? "",
  };
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const { can, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<BranchSortField>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Branch | null>(null);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [savingBranch, setSavingBranch] = useState(false);
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  const branchesQuery = useQuery({
    queryKey: ["branches", page, query, statusFilter, sortBy, sortAsc],
    enabled: !authLoading && can("branch.read"),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(pageSize),
        sort_by: sortBy,
        sort_order: sortAsc ? "ASC" : "DESC",
      });
      if (query.trim()) params.set("q", query.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await api.get<ApiResponse<BranchListData>>(
        `/branches?${params.toString()}`,
      );
      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : (data.items ?? data.results ?? data.branches ?? []);

      return {
        branches: items.map(normalizeBranch),
        total: getPaginationTotal(
          response.metadata,
          Array.isArray(data)
            ? items.length
            : (data.total ?? data.total_count ?? items.length),
        ),
      };
    },
  });

  const branches = branchesQuery.data?.branches ?? [];
  const total = branchesQuery.data?.total ?? 0;
  const loading = branchesQuery.isLoading;
  const error = branchesQuery.error
    ? branchesQuery.error instanceof ApiError
      ? branchesQuery.error.message
      : "Unable to load branches."
    : "";
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);

  function openCreate() {
    if (!can("branch.create")) return;
    setEditing(null);
    setForm({ ...emptyForm });
    setActionError("");
    setFormOpen(true);
  }

  function openEdit(branch: Branch) {
    if (!can("branch.update")) return;
    setEditing(branch);
    setForm({ name: branch.name, address: branch.address });
    setActionError("");
    setFormOpen(true);
  }

  async function openDetail(branch: Branch) {
    setActionError("");
    try {
      const response = await api.get<ApiResponse<BranchApi | BranchApi[]>>(
        `/branches/${encodeURIComponent(branch.id)}/detail`,
      );
      const detail = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      if (!detail) {
        throw new ApiError("Branch details were not found.", 404);
      }
      setSelected(normalizeBranch(detail));
    } catch (requestError) {
      setSelected(branch);
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load branch details.";
      setActionError(message);
      showError("Unable to load branch details", message);
    }
  }

  async function saveBranch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingBranch) return;
    setActionError("");

    const name = form.name.trim();
    if (!name) {
      setActionError("Branch name is required.");
      return;
    }
    if (name.length > 255 || form.address.length > 255) {
      setActionError("Name and address must be 255 characters or fewer.");
      return;
    }
    if (editing ? !can("branch.update") : !can("branch.create")) {
      setActionError(
        `You do not have permission to ${editing ? "update" : "create"} branches.`,
      );
      return;
    }

    const values = {
      name,
      address: form.address.trim() || null,
    };

    setSavingBranch(true);
    try {
      if (editing) {
        await api.put(
          `/branches/${encodeURIComponent(editing.id)}/update`,
          values,
        );
      } else {
        await api.post("/branches/create", values);
      }
      setFormOpen(false);
      showSuccess(editing ? "Branch updated" : "Branch created");
      await queryClient.invalidateQueries({ queryKey: ["branches"] });
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to save branch.";
      setActionError(message);
      showError("Unable to save branch", message);
    } finally {
      setSavingBranch(false);
    }
  }

  async function deleteBranch(branch: Branch) {
    if (deleting || !can("branch.delete")) return;
    setActionError("");
    setDeleting(true);
    try {
      await api.delete(`/branches/${encodeURIComponent(branch.id)}/delete`);
      setSelected(null);
      setDeleteTarget(null);
      showSuccess("Branch deleted");
      await queryClient.invalidateQueries({ queryKey: ["branches"] });
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to delete branch.";
      setActionError(message);
      showError("Unable to delete branch", message);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleStatus(branch: Branch) {
    if (!can("branch.update") || updatingStatusIds.has(branch.id)) return;
    setActionError("");
    setUpdatingStatusIds((current) => new Set(current).add(branch.id));
    try {
      await api.patch(
        `/branches/${encodeURIComponent(branch.id)}/status`,
        undefined,
      );
      showSuccess("Branch status updated");
      await queryClient.invalidateQueries({ queryKey: ["branches"] });
      if (selected?.id === branch.id) {
        setSelected({ ...selected, status: !branch.status });
      }
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to update branch status.";
      setActionError(message);
      showError("Unable to update branch status", message);
    } finally {
      setUpdatingStatusIds((current) => {
        const next = new Set(current);
        next.delete(branch.id);
        return next;
      });
    }
  }

  if (authLoading) return null;
  if (!can("branch.read")) {
    return (
      <main className="mx-auto w-full max-w-5xl p-5 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view branches.
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
          <h1 className="text-3xl font-semibold tracking-tight">Branches</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organization&apos;s branch locations.
          </p>
        </div>
        {can("branch.create") && (
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Plus /> Add branch
          </Button>
        )}
      </section>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>Branch directory</CardTitle>
            <CardDescription>
              Search and manage your branch locations.
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
                placeholder="Search by name or address..."
                className="pl-9"
              />
            </div>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <select
              aria-label="Sort branches by"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as BranchSortField);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="created_at">Created date</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="updated_at">Updated date</option>
            </select>
            <Button
              variant="outline"
              className="w-full gap-1 px-2 sm:w-auto"
              title={`Sort ${sortAsc ? "ascending" : "descending"}`}
              onClick={() => {
                setSortAsc((value) => !value);
                setPage(1);
              }}
            >
              {sortAsc ? <ArrowUp /> : <ArrowDown />}{" "}
              {sortAsc ? "Ascending" : "Descending"}
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
            <Table className="min-w-[820px] overflow-hidden rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16">No.</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading &&
                  Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-5 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-10" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-20" />
                      </TableCell>
                    </TableRow>
                  ))}
                {branches.map((branch, index) => (
                  <TableRow key={branch.id}>
                    <TableCell className="text-muted-foreground">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left font-medium hover:underline"
                        onClick={() => void openDetail(branch)}
                      >
                        {branch.name}
                      </button>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {branch.address || "—"}
                    </TableCell>
                    <TableCell>{branch.employeeCount}</TableCell>
                    <TableCell>
                      <Switch
                        checked={branch.status}
                        disabled={
                          !can("branch.update") ||
                          updatingStatusIds.has(branch.id)
                        }
                        onCheckedChange={() => void toggleStatus(branch)}
                        aria-label={`Turn branch status ${branch.status ? "off" : "on"}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View details"
                          onClick={() => void openDetail(branch)}
                        >
                          <Eye />
                        </Button>
                        {can("branch.update") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Edit branch"
                            onClick={() => openEdit(branch)}
                          >
                            <Pencil />
                          </Button>
                        )}
                        {can("branch.delete") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete branch"
                            onClick={() => {
                              setActionError("");
                              setDeleteTarget(branch);
                            }}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && !branches.length && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No branches found. Try changing your search or filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {total ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min((currentPage - 1) * pageSize + branches.length, total)}{" "}
              of {total} branches
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
            <DialogTitle>Branch details</DialogTitle>
            <DialogDescription>
              Information about this branch.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.employeeCount} employees assigned
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    selected.status
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {selected.status ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Address</p>
                  <p className="mt-1 font-medium">
                    {selected.address || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Branch ID</p>
                  <p className="mt-1 break-all font-medium">{selected.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="mt-1 font-medium">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last updated</p>
                  <p className="mt-1 font-medium">
                    {formatDate(selected.updatedAt)}
                  </p>
                </div>
              </div>
              {actionError && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {actionError}
                </p>
              )}
              <DialogFooter>
                {can("branch.delete") && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setActionError("");
                      setDeleteTarget(selected);
                    }}
                    disabled={deleting}
                  >
                    <Trash2 /> Delete
                  </Button>
                )}
                {can("branch.update") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelected(null);
                      openEdit(selected);
                    }}
                  >
                    <Pencil /> Edit branch
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) =>
          !open && !deleting && setDeleteTarget(null)
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete branch?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The branch{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              will be permanently deleted. Branches assigned to employees
              cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {actionError}
            </p>
          )}
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={deleting} />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => deleteTarget && void deleteBranch(deleteTarget)}
            >
              <Trash2 /> {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => !savingBranch && setFormOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit branch" : "Add branch"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update branch information below."
                : "Create a new branch location."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveBranch} className="space-y-4">
            {actionError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {actionError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="branch-name">Name</Label>
              <Input
                id="branch-name"
                required
                maxLength={255}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Head Office"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-address">Address</Label>
              <Input
                id="branch-address"
                maxLength={255}
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
                placeholder="e.g. Jakarta"
              />
              <p className="text-right text-xs text-muted-foreground">
                {form.address.length}/255
              </p>
            </div>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline" disabled={savingBranch} />}
              >
                Cancel
              </DialogClose>
              <Button type="submit" disabled={savingBranch}>
                {savingBranch && <Spinner />}
                {savingBranch
                  ? editing
                    ? "Saving..."
                    : "Creating..."
                  : editing
                    ? "Save changes"
                    : "Add branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}