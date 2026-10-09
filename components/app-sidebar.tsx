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
} from "@/components/ui/sidebar";
import { SidebarLogo } from "@/components/sidebar-logo";
import { getMe, type AuthUser } from "@/lib/api";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  adminOnly?: boolean;
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
        adminOnly: true,
      },
      {
        title: "Roles",
        href: "/roles",
        icon: KeyRound,
        adminOnly: true,
      },
      {
        title: "Departments",
        href: "/departments",
        icon: UserGroup,
      },
      {
        title: "Employees",
        href: "/employees",
        icon: IdCardLanyard,
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
  const [user, setUser] = useState<AuthUser | null>(null);

  const isWorkspaceRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/departments") ||
    pathname.startsWith("/employees") ||
    pathname.startsWith("/audit-logs") ||
    pathname.startsWith("/api-documentation") ||
    pathname.startsWith("/roles");

  useEffect(() => {
    if (!isWorkspaceRoute) return;
    let cancelled = false;
    void getMe()
      .then((data) => {
        if (!cancelled) {
          setUser(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isWorkspaceRoute]);

  if (!isWorkspaceRoute) return null;

  const isAdmin = user?.role === "ADMIN";
  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : "ME";
  const userDisplayName = user?.email ? user.email.split("@")[0] : "User";

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/50 p-2">
        <SidebarLogo />
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 gap-4">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || isAdmin
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
                          active && "shadow-xs font-semibold"
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className={cn(
                            "size-4 shrink-0 transition-all duration-150 group-hover/btn:scale-105",
                            active
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover/btn:text-foreground"
                          )}
                        />
                        <span className="flex-1 truncate">{item.title}</span>

                        {active && !item.badge && (
                          <span
                            className="ml-auto size-1.5 rounded-full bg-primary-foreground/90 shrink-0 group-data-[collapsible=icon]:hidden shadow-xs"
                            aria-hidden="true"
                          />
                        )}
                      </SidebarMenuButton>

                      {item.badge && (
                        <SidebarMenuBadge
                          className={cn(
                            "transition-colors",
                            active
                              ? "bg-primary-foreground/20 text-primary-foreground font-semibold"
                              : "bg-muted text-muted-foreground border border-border/50"
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
        })}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border/50">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1">
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
                      : "bg-muted text-muted-foreground ring-1 ring-border"
                  )}
                >
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
