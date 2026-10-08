"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Download,
  Eye,
  Search,
} from "lucide-react";
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
  id: number;
  user_id: number;
  user_email: string;
  action: Action;
  entity: Entity;
  entity_id: number;
  old_data: Record<string, string> | null;
  new_data: Record<string, string> | null;
  created_at: string;
};

const initialLogs: AuditLog[] = [
  {
    id: 1,
    user_id: 1,
    user_email: "admin@morrow.co",
    action: "CREATE",
    entity: "Employee",
    entity_id: 7,
    old_data: null,
    new_data: { name: "Dimas Kurniawan", position: "Frontend Engineer" },
    created_at: "2024-06-20T09:24:00",
  },
  {
    id: 2,
    user_id: 1,
    user_email: "admin@morrow.co",
    action: "UPDATE",
    entity: "Department",
    entity_id: 1,
    old_data: { description: "Technology team" },
    new_data: { description: "Builds and maintains the company's products." },
    created_at: "2024-06-19T16:42:00",
  },
  {
    id: 3,
    user_id: 2,
    user_email: "nadia.hr@morrow.co",
    action: "UPDATE",
    entity: "User",
    entity_id: 4,
    old_data: { status: "false" },
    new_data: { status: "true" },
    created_at: "2024-06-19T13:18:00",
  },
  {
    id: 4,
    user_id: 1,
    user_email: "admin@morrow.co",
    action: "DELETE",
    entity: "Employee",
    entity_id: 4,
    old_data: { name: "Bagas Hidayat" },
    new_data: null,
    created_at: "2024-06-18T11:05:00",
  },
  {
    id: 5,
    user_id: 1,
    user_email: "admin@morrow.co",
    action: "CREATE",
    entity: "Department",
    entity_id: 5,
    old_data: null,
    new_data: { name: "Operations" },
    created_at: "2024-06-17T10:30:00",
  },
  {
    id: 6,
    user_id: 2,
    user_email: "nadia.hr@morrow.co",
    action: "UPDATE",
    entity: "Employee",
    entity_id: 2,
    old_data: { position: "HR Assistant" },
    new_data: { position: "HR Specialist" },
    created_at: "2024-06-16T15:12:00",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
  const [logs] = useState(initialLogs);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const pageSize = 5;

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return logs
      .filter((log) => {
        const matchesQuery =
          !normalizedQuery ||
          [log.user_email, log.action, log.entity, String(log.entity_id)].some(
            (value) => value.toLowerCase().includes(normalizedQuery),
          );
        const matchesAction = action === "all" || log.action === action;
        const matchesEntity = entity === "all" || log.entity === entity;
        const createdDate = log.created_at.slice(0, 10);
        const matchesFrom = !dateFrom || createdDate >= dateFrom;
        const matchesTo = !dateTo || createdDate <= dateTo;
        return (
          matchesQuery &&
          matchesAction &&
          matchesEntity &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort((a, b) =>
        sortAsc
          ? a.created_at.localeCompare(b.created_at)
          : b.created_at.localeCompare(a.created_at),
      );
  }, [action, dateFrom, dateTo, entity, logs, query, sortAsc]);

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function resetPage() {
    setPage(1);
  }

  function exportCsv() {
    const headers = [
      "id",
      "user_id",
      "user_email",
      "action",
      "entity",
      "entity_id",
      "created_at",
    ];
    const rows = filteredLogs.map((log) =>
      headers
        .map(
          (header) =>
            `"${String(log[header as keyof AuditLog] ?? "").replaceAll('"', '""')}"`,
        )
        .join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "audit-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
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
            <Button
              variant="outline"
              onClick={() => setSortAsc((value) => !value)}
            >
              {sortAsc ? <ArrowUp /> : <ArrowDown />} Date
            </Button>
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
              {filteredLogs.length ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, filteredLogs.length)} of{" "}
              {filteredLogs.length} activities
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
