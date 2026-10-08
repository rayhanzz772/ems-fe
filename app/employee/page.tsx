"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
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

type Employee = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_id: string;
  department: string;
  position: string;
  hire_date: string;
  address: string;
  status: boolean;
};

type EmployeeForm = Omit<Employee, "id" | "employee_code" | "department">;
type DepartmentOption = {
  id: string;
  name: string;
};

const positions = [
  "Product Designer",
  "Frontend Engineer",
  "HR Specialist",
  "Finance Analyst",
  "Product Manager",
];

type EmployeeApi = Omit<Employee, "id" | "department"> & {
  id: string | number;
  department?: string;
  department_name?: string;
};

type EmployeeListData =
  | EmployeeApi[]
  | {
      items?: EmployeeApi[];
      results?: EmployeeApi[];
      employees?: EmployeeApi[];
      total?: number;
      total_count?: number;
    };

function normalizeEmployee(value: EmployeeApi): Employee {
  return {
    ...value,
    id: String(value.id),
    phone_number: value.phone_number ?? "",
    address: value.address ?? "",
    department: value.department ?? value.department_name ?? "",
  };
}

const emptyForm: EmployeeForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  department_id: "",
  position: positions[0],
  hire_date: "",
  address: "",
  status: true,
};

function fullName(employee: Employee) {
  return `${employee.first_name} ${employee.last_name}`;
}

function formatDate(date: string) {
  if (!date) return "—";

  const parsedDate = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00` : date,
  );

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
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

function StatusToggle({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Switch
      checked={active}
      onCheckedChange={onClick}
      aria-label={`Turn status ${active ? "off" : "on"}`}
    />
  );
}

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("first_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [departmentOptions, setDepartmentOptions] = useState<
    DepartmentOption[]
  >([]);
  const [hireDateFrom, setHireDateFrom] = useState("");
  const [hireDateTo, setHireDateTo] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const pageSize = 5;

  useEffect(() => {
    void getMe()
      .then((user) => setCurrentUserRole(user.role))
      .catch(() => setCurrentUserRole(null));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDepartmentOptions() {
      try {
        const response = await api.get<
          ApiResponse<DepartmentOption[]>
        >("/employees/get-all-departments");
        if (!cancelled) {
          setDepartmentOptions(response.data);
        }
      } catch (requestError) {
        if (!cancelled) {
          setActionError(
            requestError instanceof ApiError
              ? requestError.message
              : "Unable to load departments.",
          );
        }
      }
    }

    void loadDepartmentOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadEmployees = useCallback(async () => {
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
      if (statusFilter !== "all")
        params.set("status", String(statusFilter === "active"));
      if (departmentFilter !== "all")
        params.set("department_id", departmentFilter);
      if (hireDateFrom) params.set("hire_date_from", hireDateFrom);
      if (hireDateTo) params.set("hire_date_to", hireDateTo);
      const response = await api.get<ApiResponse<EmployeeListData>>(
        `/employees?${params}`,
      );
      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : (data.items ?? data.results ?? data.employees ?? []);
      setEmployees(items.map(normalizeEmployee));
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
          : "Unable to load employees.",
      );
      setEmployees([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    departmentFilter,
    hireDateFrom,
    hireDateTo,
    page,
    query,
    sortAsc,
    sortBy,
    statusFilter,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEmployees(), 250);
    return () => window.clearTimeout(timer);
  }, [loadEmployees]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleEmployees = employees;
  function openCreate() {
    if (currentUserRole !== "ADMIN") return;
    setEditing(null);
    setForm({ ...emptyForm });
    setActionError("");
    setFormOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setForm({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone_number: employee.phone_number,
      department_id: employee.department_id,
      position: employee.position,
      hire_date: employee.hire_date,
      address: employee.address,
      status: employee.status,
    });
    setActionError("");
    setFormOpen(true);
  }

  async function openDetail(employee: Employee) {
    try {
      const response = await api.get<ApiResponse<EmployeeApi>>(
        `/employees/${employee.id}/detail`,
      );
      setSelected(normalizeEmployee(response.data));
    } catch (requestError) {
      setSelected(employee);
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load employee details.",
      );
    }
  }

  async function saveEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    if (!editing && currentUserRole !== "ADMIN") {
      setActionError("Only administrators can create employees.");
      return;
    }
    try {
      if (editing) {
        await api.put(`/employees/${editing.id}/update`, form);
      } else {
        await api.post("/employees/create", form);
      }
      setFormOpen(false);
      await loadEmployees();
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to save employee.",
      );
    }
  }

  async function toggleStatus(employee: Employee) {
    setActionError("");
    try {
      await api.patch(`/employees/${employee.id}/status`, {
        status: !employee.status,
      });
      await loadEmployees();
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to update employee status.",
      );
    }
  }

  async function deleteEmployee(employee: Employee) {
    setActionError("");
    try {
      await api.delete(`/employees/${employee.id}/delete`);
      setSelected(null);
      await loadEmployees();
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to delete employee.",
      );
    }
  }

  async function exportCsv() {
    try {
      const csv = await api.get<string>("/employees/export");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "employees.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to export employees.",
      );
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Workspace / People
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your team members and employee information.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download /> Export CSV
          </Button>
          {currentUserRole === "ADMIN" && (
            <Button onClick={openCreate}>
              <Plus /> Add employee
            </Button>
          )}
        </div>
      </section>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>Employee directory</CardTitle>
            <CardDescription>
              Search and manage all employees in your organization.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, email, code..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                aria-label="Filter by department"
                value={departmentFilter}
                onChange={(event) => {
                  setDepartmentFilter(event.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All departments</option>
                {departmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="icon"
                title="Toggle sort by name"
                onClick={() => setSortAsc((value) => !value)}
              >
                {sortAsc ? <ArrowDown /> : <ArrowUp />}
              </Button>
              <select
                aria-label="Sort employees by"
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="first_name">First name</option>
                <option value="last_name">Last name</option>
                <option value="employee_code">Employee code</option>
                <option value="email">Email</option>
                <option value="department_name">Department</option>
                <option value="position">Position</option>
                <option value="status">Status</option>
                <option value="hire_date">Hire date</option>
                <option value="created_at">Created date</option>
                <option value="updated_at">Updated date</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                type="date"
                aria-label="Hire date from"
                value={hireDateFrom}
                onChange={(event) => {
                  setHireDateFrom(event.target.value);
                  setPage(1);
                }}
                className="w-auto"
              />
              <Input
                type="date"
                aria-label="Hire date to"
                value={hireDateTo}
                onChange={(event) => {
                  setHireDateTo(event.target.value);
                  setPage(1);
                }}
                className="w-auto"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(error || actionError) && (
            <p className="mx-4 mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error || actionError}
            </p>
          )}
          <div className="overflow-x-auto px-4">
            <Table className="min-w-[920px] overflow-hidden rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Hire date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Loading employees...
                    </TableCell>
                  </TableRow>
                )}
                {visibleEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-3 text-left"
                        onClick={() => void openDetail(employee)}
                      >
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {employee.first_name[0]}
                          {employee.last_name[0]}
                        </span>
                        <span>
                          <span className="block font-medium hover:underline">
                            {fullName(employee)}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {employee.email}
                          </span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.department}
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(employee.hire_date)}
                    </TableCell>
                    <TableCell>
                      <StatusToggle
                        active={employee.status}
                        onClick={() => void toggleStatus(employee)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View details"
                          onClick={() => void openDetail(employee)}
                        >
                          <Eye />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit employee"
                          onClick={() => openEdit(employee)}
                        >
                          <Pencil />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!visibleEmployees.length && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No employees found. Try changing your search or filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {total ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min((currentPage - 1) * pageSize + employees.length, total)}{" "}
              of {total} employees
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
            <DialogTitle>Employee details</DialogTitle>
            <DialogDescription>
              Complete information for this employee.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {selected.first_name[0]}
                  {selected.last_name[0]}
                </span>
                <div>
                  <p className="font-semibold">{fullName(selected)}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.employee_code} · {selected.position}
                  </p>
                </div>
                <div className="ml-auto">
                  <StatusBadge active={selected.status} />
                </div>
              </div>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="mt-1 font-medium">{selected.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="mt-1 font-medium">{selected.phone_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="mt-1 font-medium">{selected.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hire date</p>
                  <p className="mt-1 font-medium">
                    {formatDate(selected.hire_date)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground">Address</p>
                  <p className="mt-1 font-medium">{selected.address || "—"}</p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => void deleteEmployee(selected)}
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
                  <Pencil /> Edit employee
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit employee" : "Add employee"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update employee information below."
                : "Add a new member to your organization. Employee code is generated automatically."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEmployee} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                required
                value={form.first_name}
                onChange={(event) =>
                  setForm({ ...form, first_name: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                required
                value={form.last_name}
                onChange={(event) =>
                  setForm({ ...form, last_name: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={form.phone_number}
                onChange={(event) =>
                  setForm({ ...form, phone_number: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                value={form.department_id}
                onChange={(event) =>
                  setForm({ ...form, department_id: event.target.value })
                }
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {departmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <select
                id="position"
                value={form.position}
                onChange={(event) =>
                  setForm({ ...form, position: event.target.value })
                }
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {positions.map((position) => (
                  <option key={position}>{position}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hire-date">Hire date</Label>
              <Input
                id="hire-date"
                type="date"
                required
                value={form.hire_date}
                onChange={(event) =>
                  setForm({ ...form, hire_date: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
                placeholder="City or full address"
              />
            </div>
            <DialogFooter className="sm:col-span-2">
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit">
                {editing ? "Save changes" : "Add employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
