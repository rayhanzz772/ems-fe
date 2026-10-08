"use client";

import { useState } from "react";
import {
  Search,
  UsersRound,
  ArrowDown,
  ArrowUp,
  SlidersHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Button,
} from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const users = [
  { id: 1, name: "John Doe", email: "john.doe@example.com", role: "User" },
  { id: 2, name: "Jane Smith", email: "jane.smith@example.com", role: "Admin" },
  {
    id: 3,
    name: "Alex Morgan",
    email: "alex.morgan@example.com",
    role: "User",
  },
  { id: 4, name: "Sam Taylor", email: "sam.taylor@example.com", role: "User" },
  { id: 5, name: "Riley Chen", email: "riley.chen@example.com", role: "Admin" },
  { id: 6, name: "Jordan Lee", email: "jordan.lee@example.com", role: "User" },
  {
    id: 7,
    name: "Casey Patel",
    email: "casey.patel@example.com",
    role: "User",
  },
  {
    id: 8,
    name: "Morgan Rivera",
    email: "morgan.rivera@example.com",
    role: "Admin",
  },
];

export default function UsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const pageSize = 5;
  const filteredUsers = users.filter((user) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      [user.name, user.email, user.role].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesQuery && matchesRole;
  });
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const firstVisibleUser = (currentPage - 1) * pageSize;
  const visibleUsers = filteredUsers.slice(
    firstVisibleUser,
    firstVisibleUser + pageSize,
  );

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), pageCount));
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
            Manage user accounts and access roles.
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UsersRound className="size-5" />
        </div>
      </section>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Search and manage all users in your organization.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, email, code..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Filter by status"
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline" size="icon" title="More filters">
                <SlidersHorizontal />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-4">
            <Table className="min-w-[920px] overflow-hidden rounded-lg border">
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {user.id}
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-sm border px-2 py-0.5 text-xs font-medium">
                        {user.role}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!visibleUsers.length && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No users found. Try changing your search or role filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredUsers.length ? firstVisibleUser + 1 : 0}-
              {Math.min(firstVisibleUser + pageSize, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage === 1}
                    tabIndex={currentPage === 1 ? -1 : 0}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      goToPage(currentPage - 1);
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        aria-label={`Go to page ${page}`}
                        onClick={(event) => {
                          event.preventDefault();
                          goToPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage === pageCount}
                    tabIndex={currentPage === pageCount ? -1 : 0}
                    className={
                      currentPage === pageCount
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      goToPage(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
