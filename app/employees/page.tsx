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
  position_id: string;
  position: string;
  branch_id: string;
  branch: string;
  manager_id: string;
  manager: string;
  employment_type: EmploymentType;
  employment_status: EmploymentStatus;
  contract_start_date: string;
  contract_end_date: string;
  hire_date: string;
  address: string;
  status: boolean;
};

type EmploymentType = "PERMANENT" | "CONTRACT" | "INTERN";
type EmploymentStatus = "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED";

type EmployeeForm = {
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_id: string;
  position_id: string;
  branch_id: string;
  manager_id: string;
  employment_type: EmploymentType;
  employment_status: EmploymentStatus;
  contract_start_date: string;
  contract_end_date: string;
  hire_date: string;
  address: string;
  status: boolean;
};

type NamedOption = {
  id: string;
  name: string;
};

type PositionOption = NamedOption;
type BranchOption = NamedOption;
type PositionOptionListData =
  | PositionOption[]
  | {
      items?: PositionOption[];
      results?: PositionOption[];
      positions?: PositionOption[];
    };
type BranchOptionListData =
  | BranchOption[]
  | {
      items?: BranchOption[];
      results?: BranchOption[];
      branches?: BranchOption[];
    };

type EmployeeApi = {
  id: string | number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string | null;
  department_id?: string | number | null;
  department_name?: string | null;
  department?: string | { id?: string | number; name?: string } | null;
  position_id?: string | number | null;
  position?: string | { id?: string | number; name?: string } | null;
  branch_id?: string | number | null;
  branch_name?: string | null;
  branch?: string | { id?: string | number; name?: string } | null;
  manager_id?: string | number | null;
  manager_first_name?: string | null;
  manager_last_name?: string | null;
  manager?: {
    id?: string | number;
    employee_code?: string;
    first_name?: string;
    last_name?: string;
  } | null;
  employment_type?: EmploymentType;
  employment_status?: EmploymentStatus;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  hire_date?: string;
  address?: string | null;
  status?: boolean;
  created_at?: string;
  updated_at?: string;
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
      : (value.department?.name ?? value.department_name ?? "");
  const departmentId =
    value.department_id ??
    (typeof value.department === "object" ? value.department?.id : undefined) ??
    "";
  const positionName =
    typeof value.position === "string"
      ? value.position
      : (value.position?.name ?? "");
  const positionId =
    value.position_id ??
    (typeof value.position === "object" ? value.position?.id : undefined) ??
    "";
  const branchName =
    typeof value.branch === "string"
      ? value.branch
      : (value.branch?.name ?? value.branch_name ?? "");
  const branchId =
    value.branch_id ??
    (typeof value.branch === "object" ? value.branch?.id : undefined) ??
    "";
  const managerName =
    value.manager?.first_name || value.manager_first_name
      ? `${value.manager?.first_name ?? value.manager_first_name ?? ""} ${value.manager?.last_name ?? value.manager_last_name ?? ""}`.trim()
      : "";

  return {
    id: String(value.id),
    employee_code: value.employee_code ?? "",
    first_name: value.first_name ?? "",
    last_name: value.last_name ?? "",
    email: value.email ?? "",
    phone_number: value.phone_number ?? "",
    department_id: String(departmentId),
    department: departmentName,
    position_id: String(positionId),
    position: positionName,
    branch_id: String(branchId),
    branch: branchName,
    manager_id: String(
      value.manager_id ??
        (typeof value.manager === "object" ? value.manager?.id : undefined) ??
        "",
    ),
    manager: managerName,
    employment_type: value.employment_type ?? "PERMANENT",
    employment_status: value.employment_status ?? "ACTIVE",
    contract_start_date: value.contract_start_date ?? "",
    contract_end_date: value.contract_end_date ?? "",
    hire_date: value.hire_date ?? "",
    address: value.address ?? "",
    status: value.status ?? true,
  };
}

const emptyForm: EmployeeForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  employee_code: "",
  department_id: "",
  position_id: "",
  branch_id: "",
  manager_id: "",
  employment_type: "PERMANENT",
  employment_status: "ACTIVE",
  contract_start_date: "",
  contract_end_date: "",
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

function dateInputValue(date: string) {
  return date ? date.slice(0, 10) : "";
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
  const [branchFilter, setBranchFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("all");
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);
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
  const pageSize = 10;
  const queryClient = useQueryClient();
  const { can, loading: authLoading } = useAuth();

  const departmentQuery = useQuery({
    queryKey: ["employee-departments"],
    enabled: !authLoading && can("department.read"),
    queryFn: async () => {
      const response = await api.get<ApiResponse<NamedOption[]>>(
        "/employees/get-all-departments",
      );
      return response.data;
    },
  });

  const positionQuery = useQuery({
    queryKey: ["employee-positions"],
    enabled: !authLoading && can("position.read"),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        per_page: "100",
        sort_by: "name",
        sort_order: "ASC",
      });
      const response = await api.get<ApiResponse<PositionOptionListData>>(
        `/positions?${params}`,
      );
      const data = response.data;
      return Array.isArray(data)
        ? data
        : (data.items ?? data.results ?? data.positions ?? []);
    },
  });

  const branchQuery = useQuery({
    queryKey: ["employee-branches"],
    enabled: !authLoading && can("branch.read"),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        per_page: "100",
        sort_by: "name",
        sort_order: "ASC",
        status: "true",
      });
      const response = await api.get<ApiResponse<BranchOptionListData>>(
        `/branches?${params}`,
      );
      const data = response.data;
      return Array.isArray(data)
        ? data
        : (data.items ?? data.results ?? data.branches ?? []);
    },
  });

  const managerQuery = useQuery({
    queryKey: ["employee-managers"],
    enabled: !authLoading && can("employee.read"),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        per_page: "100",
        sort_by: "first_name",
        sort_order: "ASC",
      });
      const response = await api.get<ApiResponse<EmployeeListData>>(
        `/employees?${params}`,
      );
      const data = response.data;
      const items = Array.isArray(data)
        ? data
        : (data.items ?? data.results ?? data.employees ?? []);
      return items.map(normalizeEmployee);
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
      branchFilter,
      managerFilter,
      positionFilter,
      employmentTypeFilter,
      employmentStatusFilter,
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
      if (branchFilter !== "all") params.set("branch_id", branchFilter);
      if (managerFilter !== "all") params.set("manager_id", managerFilter);
      if (positionFilter.trim()) params.set("position", positionFilter.trim());
      if (employmentTypeFilter !== "all")
        params.set("employment_type", employmentTypeFilter);
      if (employmentStatusFilter !== "all")
        params.set("employment_status", employmentStatusFilter);
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
  const positionOptions = positionQuery.data ?? [];
  const branchOptions = branchQuery.data ?? [];
  const managerOptions = managerQuery.data ?? [];
  const loading = employeeQuery.isPending;
  const error = employeeQuery.error
    ? employeeQuery.error instanceof ApiError
      ? employeeQuery.error.message
      : "Unable to load employees."
    : "";
  const referenceDataError =
    departmentQuery.error ??
    positionQuery.error ??
    branchQuery.error ??
    managerQuery.error;
  const referenceDataErrorMessage = referenceDataError
    ? referenceDataError instanceof ApiError
      ? referenceDataError.message
      : "Unable to load employee reference data."
    : "";

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleEmployees = employees;
  const activeFilterCount = [
    statusFilter !== "all",
    departmentFilter !== "all",
    branchFilter !== "all",
    managerFilter !== "all",
    Boolean(positionFilter.trim()),
    employmentTypeFilter !== "all",
    employmentStatusFilter !== "all",
    sortBy !== "created_at",
    sortAsc,
    Boolean(hireDateFrom),
    Boolean(hireDateTo),
  ].filter(Boolean).length;

  function clearFilters() {
    setStatusFilter("all");
    setDepartmentFilter("all");
    setBranchFilter("all");
    setManagerFilter("all");
    setPositionFilter("");
    setEmploymentTypeFilter("all");
    setEmploymentStatusFilter("all");
    setSortBy("created_at");
    setSortAsc(false);
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
      employee_code: employee.employee_code,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone_number: employee.phone_number,
      department_id: employee.department_id,
      position_id: employee.position_id,
      branch_id: employee.branch_id,
      manager_id: employee.manager_id,
      employment_type: employee.employment_type,
      employment_status: employee.employment_status,
      contract_start_date: dateInputValue(employee.contract_start_date),
      contract_end_date: dateInputValue(employee.contract_end_date),
      hire_date: dateInputValue(employee.hire_date),
      address: employee.address,
      status: employee.status,
    });
    setActionError("");
    setFormOpen(true);
  }

  async function openDetail(employee: Employee) {
    try {
      const response = await api.get<ApiResponse<EmployeeApi>>(
        `/employees/${encodeURIComponent(employee.id)}/detail`,
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
    if (!form.position_id) {
      setActionError("Please select a position.");
      return;
    }
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setActionError("First name and last name are required.");
      return;
    }
    if (!form.phone_number.trim()) {
      setActionError("Phone number is required.");
      return;
    }
    if (!/^[0-9+()\- ]{8,20}$/.test(form.phone_number.trim())) {
      setActionError(
        "Phone number must be 8-20 characters using numbers and +()- or spaces.",
      );
      return;
    }
    if (form.employment_type === "CONTRACT") {
      if (!form.contract_start_date || !form.contract_end_date) {
        setActionError(
          "Contract start date and end date are required for contract employees.",
        );
        return;
      }
      if (form.contract_end_date < form.contract_start_date) {
        setActionError(
          "Contract end date cannot be earlier than contract start date.",
        );
        return;
      }
    }
    if (
      (editing && !can("employee.update")) ||
      (!editing && !can("employee.create"))
    ) {
      setActionError(
        `You do not have permission to ${editing ? "update" : "create"} employees.`,
      );
      return;
    }

    const payload = {
      ...(form.employee_code.trim()
        ? { employee_code: form.employee_code.trim() }
        : {}),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      department_id: form.department_id,
      position_id: form.position_id,
      branch_id: form.branch_id || null,
      manager_id: form.manager_id || null,
      employment_type: form.employment_type,
      employment_status: form.employment_status,
      contract_start_date: form.contract_start_date || null,
      contract_end_date: form.contract_end_date || null,
      status: form.status,
      hire_date: form.hire_date,
      address: form.address.trim() || null,
    };
    let requestPayload: Record<string, unknown> = payload;
    if (editing) {
      const currentValues: Record<string, unknown> = {
        first_name: editing.first_name,
        last_name: editing.last_name,
        email: editing.email,
        phone_number: editing.phone_number,
        department_id: editing.department_id,
        position_id: editing.position_id,
        branch_id: editing.branch_id || null,
        manager_id: editing.manager_id || null,
        employment_type: editing.employment_type,
        employment_status: editing.employment_status,
        contract_start_date: editing.contract_start_date || null,
        contract_end_date: editing.contract_end_date || null,
        status: editing.status,
        hire_date: dateInputValue(editing.hire_date),
        address: editing.address || null,
      };
      const updates: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(payload)) {
        if (field === "employee_code") {
          if (value !== editing.employee_code) updates[field] = value;
          continue;
        }
        if (value !== currentValues[field]) updates[field] = value;
      }
      if (
        form.employment_type === "CONTRACT" &&
        editing.employment_type !== "CONTRACT"
      ) {
        updates.contract_start_date = form.contract_start_date;
        updates.contract_end_date = form.contract_end_date;
      }
      if (!Object.keys(updates).length) {
        setActionError("No employee information has changed.");
        return;
      }
      requestPayload = updates;
    }
    setSavingEmployee(true);
    try {
      if (editing) {
        await api.put(
          `/employees/${encodeURIComponent(editing.id)}/update`,
          requestPayload,
        );
      } else {
        await api.post("/employees/create", requestPayload);
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
    if (!can("employee.update") || updatingStatusIds.has(employee.id)) return;
    setActionError("");
    setUpdatingStatusIds((current) => new Set(current).add(employee.id));
    try {
      await api.patch(
        `/employees/${encodeURIComponent(employee.id)}/status`,
        undefined,
      );
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
    if (deleting || !can("employee.delete")) return;
    setActionError("");
    setDeleting(true);
    try {
      await api.delete(`/employees/${encodeURIComponent(employee.id)}/delete`);
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
                placeholder="Search by name or email..."
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
          {error && (
            <p className="mx-4 mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="overflow-x-auto px-4">
            <Table className="min-w-[920px] overflow-hidden rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16">No.</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Branch</TableHead>
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
                        <Skeleton className="h-5 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
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
                      {employee.branch || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(employee.hire_date)}
                    </TableCell>
                    <TableCell>
                      <StatusToggle
                        active={employee.status}
                        disabled={
                          !can("employee.update") ||
                          updatingStatusIds.has(employee.id)
                        }
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
                        {can("employee.update") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Edit employee"
                            onClick={() => openEdit(employee)}
                          >
                            <Pencil />
                          </Button>
                        )}
                        {can("employee.delete") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Delete employee"
                            onClick={() => setDeleteTarget(employee)}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!visibleEmployees.length && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
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
            <div className="space-y-2">
              <Label htmlFor="employee-branch-filter">Branch</Label>
              <select
                id="employee-branch-filter"
                value={branchFilter}
                onChange={(event) => {
                  setBranchFilter(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All branches</option>
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-manager-filter">Manager</Label>
              <select
                id="employee-manager-filter"
                value={managerFilter}
                onChange={(event) => {
                  setManagerFilter(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All managers</option>
                {managerOptions.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {fullName(manager)} ({manager.employee_code})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-position-filter">Position</Label>
              <Input
                id="employee-position-filter"
                value={positionFilter}
                onChange={(event) => {
                  setPositionFilter(event.target.value);
                  setPage(1);
                }}
                placeholder="Search position name"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee-employment-type-filter">
                  Employment type
                </Label>
                <select
                  id="employee-employment-type-filter"
                  value={employmentTypeFilter}
                  onChange={(event) => {
                    setEmploymentTypeFilter(event.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="all">All types</option>
                  <option value="PERMANENT">Permanent</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee-employment-status-filter">
                  Employment status
                </Label>
                <select
                  id="employee-employment-status-filter"
                  value={employmentStatusFilter}
                  onChange={(event) => {
                    setEmploymentStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="all">All employment statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On leave</option>
                  <option value="RESIGNED">Resigned</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>
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
                  <option value="created_at">Created date</option>
                  <option value="first_name">First name</option>
                  <option value="last_name">Last name</option>
                  <option value="employee_code">Employee code</option>
                  <option value="email">Email</option>
                  <option value="department_name">Department</option>
                  <option value="position">Position</option>
                  <option value="branch_name">Branch</option>
                  <option value="employment_type">Employment type</option>
                  <option value="employment_status">Employment status</option>
                  <option value="status">Status</option>
                  <option value="hire_date">Hire date</option>
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
                  <p className="text-muted-foreground">Branch</p>
                  <p className="mt-1 font-medium">{selected.branch || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Manager</p>
                  <p className="mt-1 font-medium">{selected.manager || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employment type</p>
                  <p className="mt-1 font-medium">{selected.employment_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employment status</p>
                  <p className="mt-1 font-medium">
                    {selected.employment_status.replaceAll("_", " ")}
                  </p>
                </div>
                {selected.employment_type === "CONTRACT" && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Contract start</p>
                      <p className="mt-1 font-medium">
                        {formatDate(selected.contract_start_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contract end</p>
                      <p className="mt-1 font-medium">
                        {formatDate(selected.contract_end_date)}
                      </p>
                    </div>
                  </>
                )}
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
                {can("employee.delete") && (
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteTarget(selected)}
                    disabled={deleting}
                  >
                    <Trash2 /> Delete
                  </Button>
                )}
                {can("employee.update") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelected(null);
                      openEdit(selected);
                    }}
                  >
                    <Pencil /> Edit employee
                  </Button>
                )}
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
            {referenceDataErrorMessage && (
              <p
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive sm:col-span-2"
                role="alert"
              >
                {referenceDataErrorMessage}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="employee-code">Employee code (optional)</Label>
              <Input
                id="employee-code"
                maxLength={50}
                value={form.employee_code}
                onChange={(event) =>
                  setForm({ ...form, employee_code: event.target.value })
                }
                placeholder="Generated automatically if empty"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                required
                maxLength={100}
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
                maxLength={100}
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
                maxLength={20}
                minLength={8}
                pattern="[0-9+() -]{8,20}"
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
              <Label htmlFor="position-id">Position</Label>
              <select
                id="position-id"
                required
                value={form.position_id}
                onChange={(event) => {
                  setForm({ ...form, position_id: event.target.value });
                  setActionError("");
                }}
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Select Position
                </option>
                {positionOptions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-id">Branch (optional)</Label>
              <select
                id="branch-id"
                value={form.branch_id}
                onChange={(event) => {
                  setForm({ ...form, branch_id: event.target.value });
                  setActionError("");
                }}
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">No branch</option>
                {form.branch_id &&
                  !branchOptions.some(
                    (branch) => branch.id === form.branch_id,
                  ) && (
                    <option value={form.branch_id}>
                      Current branch (unavailable)
                    </option>
                  )}
                {branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager-id">Manager (optional)</Label>
              <select
                id="manager-id"
                value={form.manager_id}
                onChange={(event) => {
                  setForm({ ...form, manager_id: event.target.value });
                  setActionError("");
                }}
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">No manager</option>
                {managerOptions
                  .filter((manager) => manager.id !== editing?.id)
                  .map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {fullName(manager)} ({manager.employee_code})
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment-type">Employment type</Label>
              <select
                id="employment-type"
                required
                value={form.employment_type}
                onChange={(event) => {
                  setForm({
                    ...form,
                    employment_type: event.target.value as EmploymentType,
                  });
                  setActionError("");
                }}
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="PERMANENT">Permanent</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment-status">Employment status</Label>
              <select
                id="employment-status"
                required
                value={form.employment_status}
                onChange={(event) => {
                  setForm({
                    ...form,
                    employment_status: event.target.value as EmploymentStatus,
                  });
                  setActionError("");
                }}
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On leave</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
            {form.employment_type === "CONTRACT" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="contract-start-date">
                    Contract start date
                  </Label>
                  <Input
                    id="contract-start-date"
                    type="date"
                    required
                    value={form.contract_start_date}
                    onChange={(event) => {
                      setForm({
                        ...form,
                        contract_start_date: event.target.value,
                      });
                      setActionError("");
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract-end-date">Contract end date</Label>
                  <Input
                    id="contract-end-date"
                    type="date"
                    required
                    min={form.contract_start_date || undefined}
                    value={form.contract_end_date}
                    onChange={(event) => {
                      setForm({
                        ...form,
                        contract_end_date: event.target.value,
                      });
                      setActionError("");
                    }}
                  />
                </div>
              </>
            )}
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
                maxLength={255}
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
                }
                placeholder="City or full address"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <Label htmlFor="employee-active-status">Active account</Label>
              <Switch
                id="employee-active-status"
                checked={form.status}
                onCheckedChange={(status) => setForm({ ...form, status })}
                aria-label="Toggle active status"
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
                  savingEmployee || !form.department_id || !form.position_id
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
