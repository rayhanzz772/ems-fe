"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
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
  Label,
  Spinner,
  Switch,
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

type EmployeeApi = Omit<
  Employee,
  "id" | "department" | "position" | "address"
> & {
  id: string | number;
  department?: string | { id?: string | number; name?: string };
  department_name?: string | { name?: string };
  position?: string | { name?: string };
  address?: string | { name?: string; address?: string };
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
  const departmentName =
    typeof value.department === "string"
      ? value.department
      : (value.department?.name ??
        (typeof value.department_name === "string"
          ? value.department_name
          : value.department_name?.name) ??
        "");
  const departmentId =
    value.department_id ??
    (typeof value.department === "object" ? value.department.id : undefined) ??
    "";

  return {
    ...value,
    id: String(value.id),
    department_id: String(departmentId),
    phone_number: value.phone_number ?? "",
    address:
      typeof value.address === "string"
        ? value.address
        : (value.address?.address ?? value.address?.name ?? ""),
    department: departmentName,
    position:
      typeof value.position === "string"
        ? value.position
        : (value.position?.name ?? ""),
  };
}

const emptyForm: EmployeeForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  department_id: "",
  position: "",
  hire_date: "",
  address: "",
  status: true,
};

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
  disabled,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Switch
      checked={active}
      disabled={disabled}
      onCheckedChange={onClick}
      aria-label={`Turn status ${active ? "off" : "on"}`}
    />
  );
}

export default function EmployeePage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("first_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const [hireDateFrom, setHireDateFrom] = useState("");
  const [hireDateTo, setHireDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterError, setFilterError] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const pageSize = 5;
  const queryClient = useQueryClient();
  const { can, loading: authLoading } = useAuth();

  const departmentQuery = useQuery({
    queryKey: ["employee-departments"],
    enabled: !authLoading && can("employee.read"),
    queryFn: async () => {
      const response = await api.get<ApiResponse<DepartmentOption[]>>(
        "/employees/get-all-departments",
      );
      return response.data;
    },
  });

  const employeeQuery = useQuery({
    enabled: !authLoading && can("employee.read"),
    queryKey: [
      "employees",
      page,
      query,
      statusFilter,
      departmentFilter,
      sortBy,
      sortAsc,
      hireDateFrom,
      hireDateTo,
    ],
    queryFn: async () => {
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
      return api.get<ApiResponse<EmployeeListData>>(`/employees?${params}`);
    },
    placeholderData: (previousData) => previousData,
  });

  const data = employeeQuery.data?.data;
  const rawEmployees = data
    ? Array.isArray(data)
      ? data
      : (data.items ?? data.results ?? data.employees ?? [])
    : [];
  const employees = rawEmployees.map(normalizeEmployee);
  const total = employeeQuery.data
    ? getPaginationTotal(
        employeeQuery.data.metadata,
        Array.isArray(data)
          ? rawEmployees.length
          : (data?.total ?? data?.total_count ?? rawEmployees.length),
      )
    : 0;
  const departmentOptions = departmentQuery.data ?? [];
  const loading = employeeQuery.isPending;
  const error = employeeQuery.error
    ? employeeQuery.error instanceof ApiError
      ? employeeQuery.error.message
      : "Unable to load employees."
    : "";

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleEmployees = employees;
  const activeFilterCount = [
    statusFilter !== "all",
    departmentFilter !== "all",
    sortBy !== "first_name",
    !sortAsc,
    Boolean(hireDateFrom),
    Boolean(hireDateTo),
  ].filter(Boolean).length;

  function clearFilters() {
    setStatusFilter("all");
    setDepartmentFilter("all");
    setSortBy("first_name");
    setSortAsc(true);
    setHireDateFrom("");
    setHireDateTo("");
    setFilterError("");
    setPage(1);
  }

  function applyFilters() {
    if (hireDateFrom && hireDateTo && hireDateFrom > hireDateTo) {
      setFilterError("Hire date from cannot be later than hire date to.");
      return;
    }
    setFilterError("");
    setFiltersOpen(false);
  }

  function openCreate() {
    if (!can("employee.create")) return;
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
    if (savingEmployee) return;
    setActionError("");
    if (!form.department_id) {
      setActionError("Please select a department.");
      return;
    }
    if (!form.position) {
      setActionError("Please select a position.");
      return;
    }
    if (!editing && !can("employee.create")) {
      setActionError("You do not have permission to create employees.");
      return;
    }
    setSavingEmployee(true);
    try {
      if (editing) {
        await api.put(`/employees/${editing.id}/update`, form);
      } else {
        await api.post("/employees/create", form);
      }
      setFormOpen(false);
      showSuccess(editing ? "Employee updated" : "Employee created");
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to save employee.",
      );
      showError(
        "Unable to save employee",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setSavingEmployee(false);
    }
  }

  async function toggleStatus(employee: Employee) {
    if (updatingStatusIds.has(employee.id)) return;
    setActionError("");
    setUpdatingStatusIds((current) => new Set(current).add(employee.id));
    try {
      await api.patch(`/employees/${employee.id}/status`, {
        status: !employee.status,
      });
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      showSuccess("Employee status updated");
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to update employee status.",
      );
      showError(
        "Unable to update employee status",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setUpdatingStatusIds((current) => {
        const next = new Set(current);
        next.delete(employee.id);
        return next;
      });
    }
  }

  async function deleteEmployee(employee: Employee) {
    if (deleting) return;
    setActionError("");
    setDeleting(true);
    try {
      await api.delete(`/employees/${employee.id}/delete`);
      setSelected(null);
      setDeleteTarget(null);
      showSuccess("Employee deleted");
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to delete employee.",
      );
      showError(
        "Unable to delete employee",
        requestError instanceof Error ? requestError.message : undefined,
      );
    } finally {
      setDeleting(false);
    }
  }

  async function exportCsv() {
    if (exporting) return;
    setExporting(true);
    try {
      const csv = await api.get<string>("/employees/export");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "employees.csv";
      link.click();
      URL.revokeObjectURL(url);
      showSuccess("Employee export downloaded");
    } catch (requestError) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to export employees.",
      );
    } finally {
      setExporting(false);
    }
  }

  if (authLoading) return null;
  if (!can("employee.read")) {
    return (
      <main className="mx-auto w-full max-w-5xl p-5 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view employees.
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
          <h1 className="text-3xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your team members and employee information.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {can("employee.export") && (
            <Button
              className="w-full sm:w-auto"
              variant="outline"
              onClick={exportCsv}
              disabled={exporting}
            >
              {exporting ? <Spinner /> : <Download />}
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          )}
          {can("employee.create") && (
            <Button className="w-full sm:w-auto" onClick={openCreate}>
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
          <div className="flex flex-col gap-3 sm:flex-row">
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
            <Button
              variant="outline"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal /> Filters
              {activeFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary-foreground text-xs text-primary">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-4">
            <Table className="min-w-[920px] overflow-hidden rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16">No.</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Hire date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
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
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-20" />
                      </TableCell>
                    </TableRow>
                  ))}
                {visibleEmployees.map((employee, index) => (
                  <TableRow key={employee.id}>
                    <TableCell className="text-muted-foreground">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-3 text-left"
                        onClick={() => void openDetail(employee)}
                      >
                        <span
                          className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColor(employee.email)}`}
                        >
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
                        disabled={updatingStatusIds.has(employee.id)}
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
                      colSpan={7}
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

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-h-none">
          <DialogHeader>
            <DialogTitle>Filter employees</DialogTitle>
            <DialogDescription>
              Refine the employee list by status, department, sorting, or hire
              date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {filterError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {filterError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="employee-status-filter">Status</Label>
              <select
                id="employee-status-filter"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-department-filter">Department</Label>
              <select
                id="employee-department-filter"
                value={departmentFilter}
                onChange={(event) => {
                  setDepartmentFilter(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All departments</option>
                {departmentOptions.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee-sort-filter">Sort by</Label>
                <select
                  id="employee-sort-filter"
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
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
              <div className="space-y-2">
                <Label>Order</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSortAsc((value) => !value)}
                >
                  {sortAsc ? <ArrowDown /> : <ArrowUp />}
                  {sortAsc ? "Ascending" : "Descending"}
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee-hire-date-from">Hire date from</Label>
                <Input
                  id="employee-hire-date-from"
                  type="date"
                  value={hireDateFrom}
                  onChange={(event) => {
                    setHireDateFrom(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee-hire-date-to">Hire date to</Label>
                <Input
                  id="employee-hire-date-to"
                  type="date"
                  value={hireDateTo}
                  onChange={(event) => {
                    setHireDateTo(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sticky bottom-0 -mx-6 -mb-6 border-t bg-background px-6 py-4">
            <Button type="button" variant="outline" onClick={clearFilters}>
              Reset filters
            </Button>
            <Button type="button" onClick={applyFilters}>
              Apply filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <span
                  className={`flex size-12 items-center justify-center rounded-full font-semibold ${getAvatarColor(selected.email)}`}
                >
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
                  <Pencil /> Edit employee
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
            <DialogTitle>Delete employee?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The employee{" "}
              <span className="font-medium text-foreground">
                {deleteTarget && fullName(deleteTarget)}
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
              onClick={() => deleteTarget && void deleteEmployee(deleteTarget)}
            >
              <Trash2 /> {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => !savingEmployee && setFormOpen(open)}
      >
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
                required
                value={form.department_id}
                onChange={(event) => {
                  setForm({ ...form, department_id: event.target.value });
                  setActionError("");
                }}
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Select Department
                </option>
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
                required
                value={form.position}
                onChange={(event) => {
                  setForm({ ...form, position: event.target.value });
                  setActionError("");
                }}
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Select Position
                </option>
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
              {actionError && (
                <p className="mr-auto text-sm text-destructive" role="alert">
                  {actionError}
                </p>
              )}
              <DialogClose
                render={<Button variant="outline" disabled={savingEmployee} />}
              >
                Cancel
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  savingEmployee || !form.department_id || !form.position
                }
              >
                {savingEmployee && <Spinner />}
                {savingEmployee
                  ? editing
                    ? "Saving..."
                    : "Creating..."
                  : editing
                    ? "Save changes"
                    : "Add employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
