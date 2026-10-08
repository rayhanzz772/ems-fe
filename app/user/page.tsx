"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
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

type UserRole = "ADMIN" | "HR" | "EMPLOYEE";
type User = {
  id: number;
  email: string;
  role: UserRole;
  status: boolean;
};
type UserForm = {
  email: string;
  password: string;
  role: UserRole;
  status: boolean;
};

const initialUsers: User[] = [
  { id: 1, email: "admin@morrow.co", role: "ADMIN", status: true },
  { id: 2, email: "nadia.hr@morrow.co", role: "HR", status: true },
  { id: 3, email: "alya.pratama@morrow.co", role: "EMPLOYEE", status: true },
  { id: 4, email: "raka.wijaya@morrow.co", role: "EMPLOYEE", status: false },
  { id: 5, email: "finance@morrow.co", role: "HR", status: true },
  { id: 6, email: "dimas.kurniawan@morrow.co", role: "EMPLOYEE", status: true },
];

const emptyForm: UserForm = {
  email: "",
  password: "",
  role: "EMPLOYEE",
  status: true,
};

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

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const pageSize = 5;

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users
      .filter((user) => {
        const matchesQuery =
          !normalizedQuery ||
          user.email.toLowerCase().includes(normalizedQuery) ||
          user.role.toLowerCase().includes(normalizedQuery);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" ? user.status : !user.status);
        return matchesQuery && matchesRole && matchesStatus;
      })
      .sort((a, b) =>
        sortAsc
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email),
      );
  }, [query, roleFilter, sortAsc, statusFilter, users]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const activeCount = users.filter((user) => user.status).length;
  const adminCount = users.filter((user) => user.role === "ADMIN").length;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    setFormOpen(true);
  }

  function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editing) {
      setUsers((items) =>
        items.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                email: form.email,
                role: form.role,
                status: form.status,
              }
            : item,
        ),
      );
    } else {
      setUsers((items) => [
        ...items,
        {
          id: Date.now(),
          email: form.email,
          role: form.role,
          status: form.status,
        },
      ]);
    }
    setFormOpen(false);
  }

  function toggleStatus(user: User) {
    setUsers((items) =>
      items.map((item) =>
        item.id === user.id ? { ...item, status: !item.status } : item,
      ),
    );
  }

  function deleteUser(user: User) {
    setUsers((items) => items.filter((item) => item.id !== user.id));
    setSelected(null);
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Workspace / Administration
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage login accounts, roles, and access status.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Add user
        </Button>
      </section>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>User directory</CardTitle>
            <CardDescription>
              Search and manage login accounts in your organization.
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
                placeholder="Search by email or role..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All roles</option>
                <option value="ADMIN">Admin</option>
                <option value="HR">HR</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
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
              <Button
                variant="outline"
                size="icon"
                title="Toggle sort by email"
                onClick={() => setSortAsc((value) => !value)}
              >
                {sortAsc ? <ArrowDown /> : <ArrowUp />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-4">
            <Table className="min-w-[920px] overflow-hidden rounded-lg border">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-3 text-left"
                        onClick={() => setSelected(user)}
                      >
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {user.email[0].toUpperCase()}
                        </span>
                        <span className="font-medium hover:underline">
                          {user.email}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusToggle
                        active={user.status}
                        onClick={() => toggleStatus(user)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="View details"
                          onClick={() => setSelected(user)}
                        >
                          <Eye />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Edit user"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Delete user"
                          onClick={() => deleteUser(user)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!visibleUsers.length && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No users found. Try changing your search or filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {filteredUsers.length ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
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
            <DialogTitle>User details</DialogTitle>
            <DialogDescription>
              Login account and access information.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {selected.email[0].toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold">{selected.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {selected.role}
                  </p>
                </div>
                <div className="ml-auto">
                  <StatusBadge active={selected.status} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => deleteUser(selected)}
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
                  <Pencil /> Edit user
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update account access below."
                : "Create a login account for a user."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">
                Password{" "}
                {editing && (
                  <span className="font-normal text-muted-foreground">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                id="user-password"
                type="password"
                minLength={8}
                required={!editing}
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <select
                id="user-role"
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as UserRole })
                }
                className="flex h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="ADMIN">Admin</option>
                <option value="HR">HR</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.checked })
                }
                className="size-4 accent-primary"
              />{" "}
              Active account
            </label>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button type="submit">
                {editing ? "Save changes" : "Add user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
