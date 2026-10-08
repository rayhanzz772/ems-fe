"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  UsersRound,
  UserGroup,
  IdCardLanyard,
  ClipboardMinus,
  FileCodeCorner,
  KeyRound,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SidebarLogo } from "@/components/sidebar-logo";
import { getMe } from "@/lib/api";

export function AppSidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const isWorkspaceRoute =
    pathname === "/dashboard" ||
    pathname === "/users" ||
    pathname === "/departments" ||
    pathname === "/employees" ||
    pathname === "/audit-logs" ||
    pathname === "/api-documentation";
  const isRoleRoute = pathname === "/roles";

  useEffect(() => {
    if (!isWorkspaceRoute && !isRoleRoute) return;
    void getMe()
      .then((user) => setIsAdmin(user.role === "ADMIN"))
      .catch(() => setIsAdmin(false));
  }, [isRoleRoute, isWorkspaceRoute]);

  if (!isWorkspaceRoute && !isRoleRoute) return null;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-2 flex items-start gap-1">
          <SidebarLogo className="text-lg" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/dashboard" />}
                isActive={pathname === "/dashboard"}
              >
                <LayoutDashboard aria-hidden="true" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarMenu>
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/users" />}
                  isActive={pathname === "/users"}
                >
                  <UsersRound aria-hidden="true" />
                  <span>Users</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/roles" />}
                  isActive={pathname === "/roles"}
                >
                  <KeyRound aria-hidden="true" />
                  <span>Roles</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/departments" />}
                isActive={pathname === "/departments"}
              >
                <UserGroup aria-hidden="true" />
                <span>Departments</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/employees" />}
                isActive={pathname === "/employees"}
              >
                <IdCardLanyard aria-hidden="true" />
                <span>Employees</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Other</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/audit-logs" />}
                isActive={pathname === "/audit-logs"}
              >
                <ClipboardMinus aria-hidden="true" />
                <span>Audit Log</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/api-documentation" />}
                isActive={pathname === "/api-documentation"}
              >
                <FileCodeCorner aria-hidden="true" />
                <span>API Documentation</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <p className="px-2 py-1 text-xs text-muted-foreground">
          Morrow workspace
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
