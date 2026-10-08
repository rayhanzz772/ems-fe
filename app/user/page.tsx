"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  { id: 3, name: "Alex Morgan", email: "alex.morgan@example.com", role: "User" },
  { id: 4, name: "Sam Taylor", email: "sam.taylor@example.com", role: "User" },
  { id: 5, name: "Riley Chen", email: "riley.chen@example.com", role: "Admin" },
  { id: 6, name: "Jordan Lee", email: "jordan.lee@example.com", role: "User" },
  { id: 7, name: "Casey Patel", email: "casey.patel@example.com", role: "User" },
  { id: 8, name: "Morgan Rivera", email: "morgan.rivera@example.com", role: "Admin" },
];

export default function UsersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const pageCount = Math.ceil(users.length / pageSize);
  const firstVisibleUser = (currentPage - 1) * pageSize;
  const visibleUsers = users.slice(firstVisibleUser, firstVisibleUser + pageSize);

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(page, 1), pageCount));
  }

  return (
    <main className="mx-auto w-full p-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts and access roles.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Table className="min-w-[540px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col" className="w-20 text-xs font-semibold text-muted-foreground">ID</TableHead>
                <TableHead scope="col" className="text-xs font-semibold text-muted-foreground">Name</TableHead>
                <TableHead scope="col" className="text-xs font-semibold text-muted-foreground">Email</TableHead>
                <TableHead scope="col" className="text-xs font-semibold text-muted-foreground">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{user.id}</TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex rounded-sm border px-2 py-0.5 text-xs font-medium">
                      {user.role}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {firstVisibleUser + 1}
              -{Math.min(firstVisibleUser + pageSize, users.length)} of {users.length} users
            </p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage === 1}
                    tabIndex={currentPage === 1 ? -1 : 0}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      goToPage(currentPage - 1);
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
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
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage === pageCount}
                    tabIndex={currentPage === pageCount ? -1 : 0}
                    className={currentPage === pageCount ? "pointer-events-none opacity-50" : undefined}
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