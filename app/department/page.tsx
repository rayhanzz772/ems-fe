"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
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

type Department = {
  id: number;
  name: string;
  description: string;
  employeeCount: number;
};

const initialDepartments: Department[] = [
  {
    id: 1,
    name: "Engineering",
    description: "Builds and maintains the company's products and technology.",
    employeeCount: 18,
  },
  {
    id: 2,
    name: "People & Culture",
    description:
      "Supports employee experience, talent, and organizational development.",
    employeeCount: 6,
  },
  {
    id: 3,
    name: "Marketing",
    description: "Creates demand and grows the Morrow brand.",
    employeeCount: 9,
  },
  {
    id: 4,
    name: "Finance",
    description: "Manages financial planning, reporting, and operations.",
    employeeCount: 5,
  },
  {
    id: 5,
    name: "Operations",
    description: "Keeps daily business operations running smoothly.",
    employeeCount: 0,
  },
];

const emptyDepartment = { name: "", description: "" };

export default function DepartmentPage() {
  const [departments, setDepartments] = useState(initialDepartments);
  const [query, setQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Department | null>(null);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState(emptyDepartment);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const pageSize = 5;

  const filteredDepartments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return departments
      .filter(
        (department) =>
          !normalizedQuery ||
          [department.name, department.description].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          ),
      )
      .sort((a, b) =>
        sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
      );
  }, [departments, query, sortAsc]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredDepartments.length / pageSize),
  );
  const currentPage = Math.min(page, pageCount);
  const visibleDepartments = filteredDepartments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyDepartment);
    setFormOpen(true);
  }

  function openEdit(department: Department) {
    setEditing(department);
    setForm({ name: department.name, description: department.description });
    setFormOpen(true);
  }

  function saveDepartment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = {
      name: form.name.trim(),
      description: form.description.trim(),
    };
    if (editing) {
      setDepartments((items) =>
        items.map((item) =>
          item.id === editing.id ? { ...item, ...values } : item,
        ),
      );
    } else {
      setDepartments((items) => [
        ...items,
        { ...values, id: Date.now(), employeeCount: 0 },
      ]);
    }
    setFormOpen(false);
  }

  function deleteDepartment(department: Department) {
    setDeleteError("");
    if (department.employeeCount > 0) {
      setDeleteError(
        "Department cannot be deleted because it is still assigned to employees.",
      );
      return;
    }
    setDepartments((items) =>
      items.filter((item) => item.id !== department.id),
    );
    setSelected(null);
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Workspace / Organization
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your company units and team structure.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Add department
        </Button>
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
              onClick={() => setSortAsc((value) => !value)}
            >
              {sortAsc ? <ArrowDown /> : <ArrowUp />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-4">
            <Table className="min-w-[760px] overflow-hidden rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Department</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDepartments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-3 text-left"
                        onClick={() => setSelected(department)}
                      >
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
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
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View details"
                          onClick={() => setSelected(department)}
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
                          onClick={() => deleteDepartment(department)}
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
                      colSpan={4}
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
              Showing{" "}
              {filteredDepartments.length
                ? (currentPage - 1) * pageSize + 1
                : 0}
              -{Math.min(currentPage * pageSize, filteredDepartments.length)} of{" "}
              {filteredDepartments.length} departments
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
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
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
                  onClick={() => deleteDepartment(selected)}
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
