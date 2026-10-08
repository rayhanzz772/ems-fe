"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  Eye,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
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
  id: number;
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

const departments = ["Engineering", "People & Culture", "Marketing", "Finance"];
const positions = [
  "Product Designer",
  "Frontend Engineer",
  "HR Specialist",
  "Finance Analyst",
  "Product Manager",
];

const initialEmployees: Employee[] = [
  {
    id: 1,
    employee_code: "EMP-001",
    first_name: "Alya",
    last_name: "Pratama",
    email: "alya.pratama@morrow.co",
    phone_number: "+62 812-3456-7890",
    department_id: "engineering",
    department: "Engineering",
    position: "Frontend Engineer",
    hire_date: "2024-01-15",
    address: "Jakarta Selatan",
    status: true,
  },
  {
    id: 2,
    employee_code: "EMP-002",
    first_name: "Raka",
    last_name: "Wijaya",
    email: "raka.wijaya@morrow.co",
    phone_number: "+62 813-2234-5678",
    department_id: "people",
    department: "People & Culture",
    position: "HR Specialist",
    hire_date: "2023-08-21",
    address: "Tangerang",
    status: true,
  },
  {
    id: 3,
    employee_code: "EMP-003",
    first_name: "Nadia",
    last_name: "Sari",
    email: "nadia.sari@morrow.co",
    phone_number: "+62 811-9087-1122",
    department_id: "marketing",
    department: "Marketing",
    position: "Product Manager",
    hire_date: "2022-11-07",
    address: "Bandung",
    status: true,
  },
  {
    id: 4,
    employee_code: "EMP-004",
    first_name: "Bagas",
    last_name: "Hidayat",
    email: "bagas.hidayat@morrow.co",
    phone_number: "+62 852-1122-3344",
    department_id: "finance",
    department: "Finance",
    position: "Finance Analyst",
    hire_date: "2021-04-12",
    address: "Jakarta Timur",
    status: false,
  },
  {
    id: 5,
    employee_code: "EMP-005",
    first_name: "Sinta",
    last_name: "Lestari",
    email: "sinta.lestari@morrow.co",
    phone_number: "+62 822-4455-6677",
    department_id: "engineering",
    department: "Engineering",
    position: "Product Designer",
    hire_date: "2024-03-04",
    address: "Depok",
    status: true,
  },
  {
    id: 6,
    employee_code: "EMP-006",
    first_name: "Dimas",
    last_name: "Kurniawan",
    email: "dimas.kurniawan@morrow.co",
    phone_number: "+62 878-3344-5566",
    department_id: "engineering",
    department: "Engineering",
    position: "Frontend Engineer",
    hire_date: "2023-06-19",
    address: "Bekasi",
    status: true,
  },
];

const emptyForm: EmployeeForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  department_id: "engineering",
  position: positions[0],
  hire_date: "",
  address: "",
  status: true,
};

function fullName(employee: Employee) {
  return `${employee.first_name} ${employee.last_name}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
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

export default function EmployeePage() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const pageSize = 5;

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return employees
      .filter((employee) => {
        const matchesQuery =
          !normalizedQuery ||
          [
            fullName(employee),
            employee.email,
            employee.employee_code,
            employee.position,
          ].some((value) => value.toLowerCase().includes(normalizedQuery));
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" ? employee.status : !employee.status);
        const matchesDepartment =
          departmentFilter === "all" ||
          employee.department_id === departmentFilter;
        return matchesQuery && matchesStatus && matchesDepartment;
      })
      .sort((a, b) =>
        sortAsc
          ? fullName(a).localeCompare(fullName(b))
          : fullName(b).localeCompare(fullName(a)),
      );
  }, [departmentFilter, employees, query, sortAsc, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(employee: Employee) {
    setEditing(employee);
    setForm({ ...employee });
    setFormOpen(true);
  }

  function saveEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const department =
      departments.find((item) =>
        item
          .toLowerCase()
          .startsWith(
            form.department_id === "people" ? "people" : form.department_id,
          ),
      ) ?? "Engineering";
    if (editing) {
      setEmployees((items) =>
        items.map((item) =>
          item.id === editing.id ? { ...item, ...form, department } : item,
        ),
      );
    } else {
      setEmployees((items) => [
        ...items,
        {
          ...form,
          department,
          id: Date.now(),
          employee_code: `EMP-${String(items.length + 1).padStart(3, "0")}`,
        },
      ]);
    }
    setFormOpen(false);
  }

  function toggleStatus(employee: Employee) {
    setEmployees((items) =>
      items.map((item) =>
        item.id === employee.id ? { ...item, status: !item.status } : item,
      ),
    );
  }

  function deleteEmployee(employee: Employee) {
    setEmployees((items) => items.filter((item) => item.id !== employee.id));
    setSelected(null);
  }

  function exportCsv() {
    const headers = [
      "employee_code",
      "first_name",
      "last_name",
      "email",
      "phone_number",
      "department",
      "position",
      "hire_date",
      "status",
    ];
    const rows = filteredEmployees.map((employee) =>
      headers
        .map(
          (header) =>
            `"${String(employee[header as keyof Employee] ?? "").replaceAll('"', '""')}"`,
        )
        .join(","),
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employees.csv";
    link.click();
    URL.revokeObjectURL(url);
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
          <Button onClick={openCreate}>
            <Plus /> Add employee
          </Button>
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
                <option value="engineering">Engineering</option>
                <option value="people">People & Culture</option>
                <option value="marketing">Marketing</option>
                <option value="finance">Finance</option>
              </select>
              <Button
                variant="outline"
                size="icon"
                title="Toggle sort by name"
                onClick={() => setSortAsc((value) => !value)}
              >
                {sortAsc ? <ArrowDown /> : <ArrowUp />}
              </Button>
              <Button variant="outline" size="icon" title="More filters">
                <SlidersHorizontal />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
                {visibleEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-3 text-left"
                        onClick={() => setSelected(employee)}
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
                      <StatusBadge active={employee.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View details"
                          onClick={() => setSelected(employee)}
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
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Toggle status"
                          onClick={() => toggleStatus(employee)}
                        >
                          {employee.status ? <X /> : <Check />}
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
              Showing{" "}
              {filteredEmployees.length ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, filteredEmployees.length)} of{" "}
              {filteredEmployees.length} employees
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
                  onClick={() => deleteEmployee(selected)}
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
                <option value="engineering">Engineering</option>
                <option value="people">People & Culture</option>
                <option value="marketing">Marketing</option>
                <option value="finance">Finance</option>
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
