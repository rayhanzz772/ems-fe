"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
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
import { useAuth } from "@/hooks/use-auth";
import { showError, showSuccess } from "@/lib/toast";

type Position = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type PositionApi = {
  id: string | number;
  name?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

type PositionListData =
  | PositionApi[]
  | {
      items?: PositionApi[];
      results?: PositionApi[];
      positions?: PositionApi[];
      total?: number;
      total_count?: number;
    };

type PositionSortField = "name" | "created_at" | "updated_at";

const emptyForm = { name: "", description: "" };
const pageSize = 10;

function normalizePosition(value: PositionApi): Position {
  return {
    id: String(value.id),
    name: value.name ?? "",
    description: value.description ?? "",
    createdAt: value.created_at ?? "",
    updatedAt: value.updated_at ?? "",
  };
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function PositionPage() {
  const queryClient = useQueryClient();
  const { can, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<PositionSortField>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Position | null>(null);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [savingPosition, setSavingPosition] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");

  const positionsQuery = useQuery({
    queryKey: ["positions", page, query, sortBy, sortAsc],
    enabled: !authLoading && can("position.read"),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(pageSize),
        sort_by: sortBy,
        sort_order: sortAsc ? "ASC" : "DESC",
      });
      if (query.trim()) params.set("q", query.trim());

      const response = await api.get<ApiResponse<PositionListData>>(
        `/positions?${params.toString()}`,
      );
      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : (data.items ?? data.results ?? data.positions ?? []);

      return {
        positions: items.map(normalizePosition),
        total: getPaginationTotal(
          response.metadata,
          Array.isArray(data)
            ? items.length
            : (data.total ?? data.total_count ?? items.length),
        ),
      };
    },
  });

  const positions = positionsQuery.data?.positions ?? [];
  const total = positionsQuery.data?.total ?? 0;
  const loading = positionsQuery.isLoading;
  const error = positionsQuery.error
    ? positionsQuery.error instanceof ApiError
      ? positionsQuery.error.message
      : "Unable to load positions."
    : "";
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);

  function openCreate() {
    if (!can("position.create")) return;
    setEditing(null);
    setForm({ ...emptyForm });
    setActionError("");
    setFormOpen(true);
  }

  function openEdit(position: Position) {
    if (!can("position.update")) return;
    setEditing(position);
    setForm({ name: position.name, description: position.description });
    setActionError("");
    setFormOpen(true);
  }

  async function openDetail(position: Position) {
    setActionError("");
    try {
      const response = await api.get<
        ApiResponse<PositionApi | PositionApi[]>
      >(`/positions/${encodeURIComponent(position.id)}/detail`);
      const detail = Array.isArray(response.data)
        ? response.data[0]
        : response.data;
      if (!detail) {
        throw new ApiError("Position details were not found.", 404);
      }
      setSelected(normalizePosition(detail));
    } catch (requestError) {
      setSelected(position);
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load position details.";
      setActionError(message);
      showError("Unable to load position details", message);
    }
  }

  async function savePosition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingPosition) return;
    setActionError("");

    const values = {
      name: form.name.trim(),
      description: form.description.trim(),
    };
    if (!values.name || !values.description) {
      setActionError("Name and description are required.");
      return;
    }
    if (values.name.length > 255 || values.description.length > 255) {
      setActionError("Name and description must be 255 characters or fewer.");
      return;
    }
    if (editing ? !can("position.update") : !can("position.create")) {
      setActionError(
        `You do not have permission to ${editing ? "update" : "create"} positions.`,
      );
      return;
    }

    setSavingPosition(true);
    try {
      if (editing) {
        await api.put(
          `/positions/${encodeURIComponent(editing.id)}/update`,
          values,
        );
      } else {
        await api.post("/positions/create", values);
      }
      setFormOpen(false);
      showSuccess(editing ? "Position updated" : "Position created");
      await queryClient.invalidateQueries({ queryKey: ["positions"] });
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to save position.";
      setActionError(message);
      showError("Unable to save position", message);
    } finally {
      setSavingPosition(false);
    }
  }

  async function deletePosition(position: Position) {
    if (deleting || !can("position.delete")) return;
    setActionError("");
    setDeleting(true);
    try {
      await api.delete(`/positions/${encodeURIComponent(position.id)}/delete`);
      setSelected(null);
      setDeleteTarget(null);
      showSuccess("Position deleted");
      await queryClient.invalidateQueries({ queryKey: ["positions"] });
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to delete position.";
      setActionError(message);
      showError("Unable to delete position", message);
    } finally {
      setDeleting(false);
    }
  }

  if (authLoading) return null;
  if (!can("position.read")) {
    return (
      <main className="mx-auto w-full max-w-5xl p-5 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view positions.
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
          <h1 className="text-3xl font-semibold tracking-tight">Positions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define and manage employee positions in your organization.
          </p>
        </div>
        {can("position.create") && (
          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Plus /> Add position
          </Button>
        )}
      </section>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>Position directory</CardTitle>
            <CardDescription>
              Search and manage position titles and descriptions.
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
                placeholder="Search by position name or description..."
                className="pl-9"
              />
            </div>
            <select
              aria-label="Sort positions by"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as PositionSortField);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="created_at">Created date</option>
              <option value="name">Name</option>
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
            <Table className="min-w-[760px] overflow-hidden rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16">No.</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
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
                        <Skeleton className="h-5 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-64" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-20" />
                      </TableCell>
                    </TableRow>
                  ))}
                {positions.map((position, index) => (
                  <TableRow key={position.id}>
                    <TableCell className="text-muted-foreground">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-3 text-left"
                        onClick={() => void openDetail(position)}
                      >
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <BriefcaseBusiness className="size-4" />
                        </span>
                        <span className="font-medium hover:underline">
                          {position.name}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {position.description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(position.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View details"
                          onClick={() => void openDetail(position)}
                        >
                          <Eye />
                        </Button>
                        {can("position.update") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Edit position"
                            onClick={() => openEdit(position)}
                          >
                            <Pencil />
                          </Button>
                        )}
                        {can("position.delete") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete position"
                            onClick={() => {
                              setActionError("");
                              setDeleteTarget(position);
                            }}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && !positions.length && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No positions found. Try changing your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {total ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min((currentPage - 1) * pageSize + positions.length, total)}{" "}
              of {total} positions
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
            <DialogTitle>Position details</DialogTitle>
            <DialogDescription>
              Information about this position.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BriefcaseBusiness className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Position ID: {selected.id}
                  </p>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Description</p>
                <p className="mt-1 font-medium">{selected.description}</p>
              </div>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
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
                {can("position.delete") && (
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
                {can("position.update") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelected(null);
                      openEdit(selected);
                    }}
                  >
                    <Pencil /> Edit position
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
            <DialogTitle>Delete position?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The position{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>{" "}
              will be permanently deleted. Positions assigned to employees
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
              onClick={() => deleteTarget && void deletePosition(deleteTarget)}
            >
              <Trash2 /> {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => !savingPosition && setFormOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit position" : "Add position"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update position information below."
                : "Create a new employee position."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={savePosition} className="space-y-4">
            {actionError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {actionError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="position-name">Name</Label>
              <Input
                id="position-name"
                required
                maxLength={255}
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-description">Description</Label>
              <Textarea
                id="position-description"
                required
                maxLength={255}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Describe the responsibilities of this position"
                rows={4}
              />
              <p className="text-right text-xs text-muted-foreground">
                {form.description.length}/255
              </p>
            </div>
            <DialogFooter>
              <DialogClose
                render={
                  <Button variant="outline" disabled={savingPosition} />
                }
              >
                Cancel
              </DialogClose>
              <Button type="submit" disabled={savingPosition}>
                {savingPosition && <Spinner />}
                {savingPosition
                  ? editing
                    ? "Saving..."
                    : "Creating..."
                  : editing
                    ? "Save changes"
                    : "Add position"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}