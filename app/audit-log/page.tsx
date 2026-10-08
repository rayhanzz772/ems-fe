"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Download,
  Eye,
  Search,
} from "lucide-react";
import { ApiError, api, type ApiResponse } from "@/lib/api";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
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

type AuditLogListData = AuditLogApi[] | {
  items?: AuditLogApi[];
  results?: AuditLogApi[];
  audit_logs?: AuditLogApi[];
  total?: number;
  total_count?: number;
};

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
  const styles = {
    CREATE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    UPDATE: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    DELETE: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[action]}`}
    >
      {action}
    </span>
  );
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const pageSize = 5;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
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
        : data.items ?? data.results ?? data.audit_logs ?? [];
      setLogs(items.map(normalizeLog));
      setTotal(
        Array.isArray(data)
          ? items.length
          : data.total ?? data.total_count ?? items.length,
      );
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load audit logs.",
      );
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [action, dateFrom, dateTo, entity, page, query, sortAsc, sortBy, userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLogs(), 250);
    return () => window.clearTimeout(timer);
  }, [loadLogs]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleLogs = logs;

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
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to export audit logs.",
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Workspace / Compliance
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Audit Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track important changes made across your organization.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download /> Export CSV
        </Button>
      </section>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>Activity history</CardTitle>
            <CardDescription>Review who changed what and when.</CardDescription>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
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
            <select
              aria-label="Filter by action"
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                resetPage();
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
            <select
              aria-label="Filter by entity"
              value={entity}
              onChange={(event) => {
                setEntity(event.target.value);
                resetPage();
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="all">All entities</option>
              <option value="Employee">Employee</option>
              <option value="User">User</option>
              <option value="Department">Department</option>
            </select>
            <Input
              aria-label="Filter by user ID"
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value);
                resetPage();
              }}
              placeholder="User ID"
            />
            <Button
              variant="outline"
              onClick={() => setSortAsc((value) => !value)}
            >
              {sortAsc ? <ArrowUp /> : <ArrowDown />} Date
            </Button>
            <select
              aria-label="Sort audit logs by"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                resetPage();
              }}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              <option value="created_at">Created date</option>
              <option value="action">Action</option>
              <option value="entity">Entity</option>
              <option value="entity_id">Entity ID</option>
              <option value="user_email">User email</option>
            </select>
            <Input
              aria-label="Filter from date"
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                resetPage();
              }}
            />
            <Input
              aria-label="Filter to date"
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                resetPage();
              }}
            />
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
                  <TableHead className="w-20 text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                )}
                {visibleLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <ClipboardList className="size-4" />
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
              Showing{" "}
              {total ? (currentPage - 1) * pageSize + 1 : 0}-
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

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-2xl">
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
                  <p className="mt-1 font-medium">{selected.user_email}</p>
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
    </main>
  );
}
