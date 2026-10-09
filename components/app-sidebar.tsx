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
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarLogo } from "@/components/sidebar-logo";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  permission?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: "dashboard.read",
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: UsersRound,
        permission: "user.read",
      },
      {
        title: "Roles",
        href: "/roles",
        icon: KeyRound,
        permission: "role.read",
      },
      {
        title: "Departments",
        href: "/departments",
        icon: UserGroup,
        permission: "department.read",
      },
      {
        title: "Employees",
        href: "/employees",
        icon: IdCardLanyard,
        permission: "employee.read",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        title: "Audit Log",
        href: "/audit-logs",
        icon: ClipboardMinus,
        permission: "audit_log.read",
      },
      {
        title: "API Documentation",
        href: "/api-documentation",
        icon: FileCodeCorner,
        badge: "v1.0",
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, loading: isLoading, can } = useAuth();

  const isWorkspaceRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/departments") ||
    pathname.startsWith("/employees") ||
    pathname.startsWith("/audit-logs") ||
    pathname.startsWith("/api-documentation") ||
    pathname.startsWith("/roles");

  if (!isWorkspaceRoute) return null;
  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "ME";
  const userDisplayName = user?.email ? user.email.split("@")[0] : "User";

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 shrink-0 border-b border-sidebar-border/50 px-3 flex items-center justify-center">
        {isLoading ? (
          <div
            className="flex w-full items-center gap-3 py-1.5"
            role="status"
            aria-label="Loading application identity"
          >
            <Skeleton className="size-8 shrink-0 rounded-md" />
            <div className="flex min-w-0 flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          </div>
        ) : (
          <SidebarLogo />
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="mb-1">
                <Skeleton className="h-3 w-16" />
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon width="65%" />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="mb-1">
                <Skeleton className="h-3 w-24" />
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon width="50%" />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon width="40%" />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon width="70%" />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon width="60%" />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="mb-1">
                <Skeleton className="h-3 w-14" />
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon width="55%" />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon width="80%" />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </div>
        ) : (
          navSections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permission || can(item.permission),
            );

            if (visibleItems.length === 0) return null;

            return (
              <SidebarGroup key={section.label} className="p-0">
                <SidebarGroupLabel className="mb-1">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const active = isItemActive(item.href);
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={active}
                          tooltip={item.title}
                          className={cn(
                            "relative group/btn transition-all duration-150",
                            active && "font-semibold",
                          )}
                        >
                          <Icon
                            aria-hidden="true"
                            className={cn(
                              "size-4 shrink-0 transition-all duration-150 group-hover/btn:scale-105",
                              active
                                ? "text-primary"
                                : "text-muted-foreground group-hover/btn:text-foreground",
                            )}
                          />
                          <span className="flex-1 truncate">{item.title}</span>

                          {active && !item.badge && (
                            <span
                              className="ml-auto size-1.5 rounded-full bg-primary shrink-0 group-data-[collapsible=icon]:hidden shadow-xs"
                              aria-hidden="true"
                            />
                          )}
                        </SidebarMenuButton>

                        {item.badge && (
                          <SidebarMenuBadge
                            className={cn(
                              "transition-colors",
                              active
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground border border-border/50",
                            )}
                          >
                            {item.badge}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            );
          })
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border/50">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1">
          {isLoading ? (
            <>
              <Skeleton className="size-7 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
                <div className="flex items-center justify-between gap-1">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-12 rounded" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary ring-1 ring-primary/20">
                {userInitials}
              </div>
              <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {userDisplayName}
                  </span>
                  {user?.role && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.2 text-[9px] font-bold tracking-wide uppercase",
                        user.role === "ADMIN"
                          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                          : "bg-muted text-muted-foreground ring-1 ring-border",
                      )}
                    >
                      {user.role}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
