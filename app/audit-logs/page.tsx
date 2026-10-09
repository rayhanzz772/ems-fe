"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  Pencil,
  Search,
  SlidersHorizontal,
  SquarePen,
  Trash,
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
  Skeleton,
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

type Action = "CREATE" | "UPDATE" | "DELETE";
type Entity = "Employee" | "User" | "Department";
type AuditLog = {
  id: string;
  user_id: string;
  user_email: string;
  action: Action;
  entity: Entity;
  entity_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

type AuditLogApi = Omit<AuditLog, "id" | "user_id" | "entity_id"> & {
  id: string | number;
  user_id: string | number;
  entity_id: string | number;
};

type AuditLogListData =
  | AuditLogApi[]
  | {
      items?: AuditLogApi[];
      results?: AuditLogApi[];
      audit_logs?: AuditLogApi[];
      total?: number;
      total_count?: number;
      pagination?: {
        total?: number;
        total_count?: number;
      };
    };

const actionVisuals = {
  CREATE: {
    icon: Pencil,
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    badgeClassName:
      "border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  UPDATE: {
    icon: SquarePen,
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
    badgeClassName:
      "border border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  DELETE: {
    icon: Trash,
    className: "bg-red-500/15 text-red-600 dark:text-red-300",
    badgeClassName:
      "border border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300",
  },
} satisfies Record<
  Action,
  {
    icon: typeof Pencil;
    className: string;
    badgeClassName: string;
  }
>;

function getTotal(
  data: AuditLogListData,
  metadata: Record<string, unknown> | undefined,
  itemCount: number,
): number {
  const metadataTotal =
    typeof metadata?.total === "number" ? metadata.total : undefined;
  const metadataTotalCount =
    typeof metadata?.total_count === "number"
      ? metadata.total_count
      : undefined;
  if (Array.isArray(data)) {
    const metadataPagination =
      metadata?.pagination &&
      typeof metadata.pagination === "object" &&
      metadata.pagination !== null
        ? (metadata.pagination as { total?: number; total_count?: number })
        : undefined;
    return (
      metadataTotal ??
      metadataTotalCount ??
      metadataPagination?.total ??
      metadataPagination?.total_count ??
      itemCount
    );
  }

  return (
    data.total ??
    data.total_count ??
    data.pagination?.total ??
    data.pagination?.total_count ??
    metadataTotal ??
    metadataTotalCount ??
    itemCount
  );
}

function normalizeLog(log: AuditLogApi): AuditLog {
  return {
    ...log,
    id: String(log.id),
    user_id: String(log.user_id),
    entity_id: String(log.entity_id),
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ActionBadge({ action }: { action: Action }) {
  const { icon: Icon, badgeClassName } = actionVisuals[action];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badgeClassName}`}
    >
      <Icon className="size-3.5" />
      {action}
    </span>
  );
}

export default function AuditLogPage() {
  const queryClient = useQueryClient();
  const { can, loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuditLog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const pageSize = 5;

  const logsQuery = useQuery({
    enabled: !authLoading && can("audit_log.read"),
    queryKey: [
      "audit-logs",
      page,
      query,
      action,
      entity,
      userId,
      dateFrom,
      dateTo,
      sortBy,
      sortAsc,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(pageSize),
        sort_by: sortBy,
        sort_order: sortAsc ? "ASC" : "DESC",
      });
      if (query.trim()) params.set("q", query.trim());
      if (action !== "all") params.set("action", action);
      if (entity !== "all") params.set("entity", entity);
      if (userId.trim()) params.set("user_id", userId.trim());
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      const response = await api.get<ApiResponse<AuditLogListData>>(
        `/audit-logs?${params.toString()}`,
      );
      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : (data.items ?? data.results ?? data.audit_logs ?? []);
      return {
        logs: items.map(normalizeLog),
        total: getPaginationTotal(
          response.metadata,
          getTotal(data, response.metadata, items.length),
        ),
      };
    },
  });

  const logs = logsQuery.data?.logs ?? [];
  const total = logsQuery.data?.total ?? 0;
  const loading = logsQuery.isLoading;
  const error = logsQuery.error
    ? logsQuery.error instanceof ApiError
      ? logsQuery.error.message
      : "Unable to load audit logs."
    : "";

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleLogs = logs;

  if (authLoading) return null;
  if (!can("audit_log.read")) {
    return (
      <main className="mx-auto w-full max-w-5xl p-5 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view audit logs.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  function resetPage() {
    setPage(1);
  }

  async function exportCsv() {
    try {
      const csv = await api.get<string>("/audit-logs/export");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "audit-logs.csv";
      link.click();
      URL.revokeObjectURL(url);
      showSuccess("Audit log export downloaded");
    } catch (requestError) {
      showError(
        "Unable to export audit logs",
        requestError instanceof Error ? requestError.message : undefined,
      );
    }
  }

  async function deleteLog() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await api.delete(`/audit-logs/${deleteTarget.id}/delete`);
      showSuccess("Audit log deleted successfully.");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    } catch (requestError) {
      showError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to delete audit log.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Audit Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track important changes made across your organization.
          </p>
        </div>
        {can("audit_log.export") && (
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            onClick={exportCsv}
          >
            <Download /> Export CSV
          </Button>
        )}
      </section>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>Activity history</CardTitle>
            <CardDescription>Review who changed what and when.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  resetPage();
                }}
                placeholder="Search email, entity, action..."
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
            <Table className="min-w-[980px] overflow-hidden rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Activity</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading &&
                  Array.from({ length: 5 }, (_, index) => (
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
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-20" />
                      </TableCell>
                    </TableRow>
                  ))}
                {visibleLogs.map((log) => {
                  const ActivityIcon = actionVisuals[log.action].icon;

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-9 items-center justify-center rounded-full ${actionVisuals[log.action].className}`}
                          >
                            <ActivityIcon className="size-4" />
                          </span>
                          <span>
                            <span className="block font-medium">
                              {log.user_email}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              ID #{log.user_id} changed record #{log.entity_id}
                            </span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      <TableCell>{log.entity}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="View changes"
                            onClick={() => setSelected(log)}
                          >
                            <Eye />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete audit log"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(log)}
                          >
                            <Trash />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!visibleLogs.length && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No audit activities found. Try changing your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {total ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min((currentPage - 1) * pageSize + logs.length, total)} of{" "}
              {total} activities
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

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter audit logs</DialogTitle>
            <DialogDescription>
              Refine activity by action, entity, user, date, or sorting.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="audit-action-filter"
                  className="text-sm font-medium"
                >
                  Action
                </label>
                <select
                  id="audit-action-filter"
                  value={action}
                  onChange={(event) => {
                    setAction(event.target.value);
                    resetPage();
                  }}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="all">All actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                </select>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="audit-entity-filter"
                  className="text-sm font-medium"
                >
                  Entity
                </label>
                <select
                  id="audit-entity-filter"
                  value={entity}
                  onChange={(event) => {
                    setEntity(event.target.value);
                    resetPage();
                  }}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="all">All entities</option>
                  <option value="Employee">Employee</option>
                  <option value="User">User</option>
                  <option value="Department">Department</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="audit-user-filter"
                className="text-sm font-medium"
              >
                User ID
              </label>
              <Input
                id="audit-user-filter"
                value={userId}
                onChange={(event) => {
                  setUserId(event.target.value);
                  resetPage();
                }}
                placeholder="User ID"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="audit-sort-filter"
                  className="text-sm font-medium"
                >
                  Sort by
                </label>
                <select
                  id="audit-sort-filter"
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    resetPage();
                  }}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="created_at">Created date</option>
                  <option value="action">Action</option>
                  <option value="entity">Entity</option>
                  <option value="entity_id">Entity ID</option>
                  <option value="user_email">User email</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Order</label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSortAsc((value) => !value)}
                >
                  {sortAsc ? <ArrowUp /> : <ArrowDown />}{" "}
                  {sortAsc ? "Ascending" : "Descending"}
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="audit-date-from"
                  className="text-sm font-medium"
                >
                  Date from
                </label>
                <Input
                  id="audit-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    resetPage();
                  }}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="audit-date-to" className="text-sm font-medium">
                  Date to
                </label>
                <Input
                  id="audit-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    resetPage();
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAction("all");
                setEntity("all");
                setUserId("");
                setSortBy("created_at");
                setSortAsc(false);
                setDateFrom("");
                setDateTo("");
                resetPage();
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
        <DialogContent className="w-[calc(100%-2rem)] max-w-6xl">
          <DialogHeader>
            <DialogTitle>Audit activity details</DialogTitle>
            <DialogDescription>
              Review the data before and after this activity.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="mt-1 font-medium shrink-0 truncate">
                    {selected.user_email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Action</p>
                  <p className="mt-1">
                    <ActionBadge action={selected.action} />
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created at</p>
                  <p className="mt-1 font-medium">
                    {formatDate(selected.created_at)}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium">Old data</p>
                  <pre className="min-h-24 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {selected.old_data
                      ? JSON.stringify(selected.old_data, null, 2)
                      : "No previous data"}
                  </pre>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">New data</p>
                  <pre className="min-h-24 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {selected.new_data
                      ? JSON.stringify(selected.new_data, null, 2)
                      : "No new data"}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete audit log?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected audit log for{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.entity}
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
              onClick={() => void deleteLog()}
            >
              <Trash />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
