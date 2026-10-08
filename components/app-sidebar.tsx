"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UsersRound,
  UserGroup,
  IdCardLanyard,
  ClipboardMinus,
  FileCodeCorner,
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

export function AppSidebar() {
  const pathname = usePathname();
  const isWorkspaceRoute =
    pathname === "/dashboard" ||
    pathname === "/user" ||
    pathname === "/department" ||
    pathname === "/employee" ||
    pathname === "/audit-log" ||
    pathname === "/audit-logs" ||
    pathname === "/api-docs";

  if (!isWorkspaceRoute) return null;

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
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/user" />}
                isActive={pathname === "/user"}
              >
                <UsersRound aria-hidden="true" />
                <span>Users</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/department" />}
                isActive={pathname === "/department"}
              >
                <UserGroup aria-hidden="true" />
                <span>Departments</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/employee" />}
                isActive={pathname === "/employee"}
              >
                <IdCardLanyard aria-hidden="true" />
                <span>Employee</span>
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
                isActive={pathname === "/audit-log" || pathname === "/audit-logs"}
              >
                <ClipboardMinus aria-hidden="true" />
                <span>Audit Log</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/api-docs" />}
                isActive={pathname === "/api-docs"}
              >
                <FileCodeCorner aria-hidden="true" />
                <span>API Docs</span>
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
