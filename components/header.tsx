"use client";

import { ChevronDown, ChevronRight, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import {
  Button,
  AnimatedThemeToggler,
  Skeleton,
  Spinner,
} from "@/components/ui";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { showError, showSuccess } from "@/lib/toast";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isNavigating, startTransition] = useTransition();

  const showSidebar =
    pathname === "/dashboard" ||
    pathname === "/users" ||
    pathname === "/departments" ||
    pathname === "/branches" ||
    pathname === "/positions" ||
    pathname === "/employees" ||
    pathname === "/leaves" ||
    pathname === "/audit-logs" ||
    pathname === "/api-documentation" ||
    pathname === "/roles";
  const showLogo = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      showSuccess("Signed out");
    } catch (error) {
      showError(
        "Sign out failed",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      startTransition(() => {
        setLoggingOut(false);
        router.push("/login");
      });
    }
  };

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "--";
  const userLabel = user?.email ?? (authLoading ? "Loading..." : "Unavailable");
  const breadcrumb = {
    "/dashboard": { section: "Overview", label: "Dashboard" },
    "/users": { section: "Management", label: "Users" },
    "/departments": { section: "Management", label: "Departments" },
    "/branches": { section: "Management", label: "Branches" },
    "/positions": { section: "Management", label: "Positions" },
    "/employees": { section: "Management", label: "Employees" },
    "/leaves": { section: "Management", label: "Leaves" },
    "/audit-logs": { section: "System", label: "Audit Log" },
    "/api-documentation": { section: "System", label: "API Docs" },
    "/roles": { section: "Management", label: "Roles" },
  }[pathname];

  return (
    <>
      <header className="z-10 h-16 w-full shrink-0 border-b bg-background">
        <div className="mx-auto flex h-full w-full items-center justify-between px-5">
          <div className="flex items-center gap-2">
            {showSidebar && <SidebarTrigger title="Toggle navigation" />}
            {showSidebar && breadcrumb && authLoading && (
              <div
                className="hidden items-center gap-2 sm:flex"
                role="status"
                aria-label="Loading breadcrumb"
              >
                <Skeleton className="h-4 w-20" />
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <Skeleton className="h-4 w-24" />
              </div>
            )}
            {showSidebar && breadcrumb && !authLoading && (
              <nav
                aria-label="Breadcrumb"
                className="hidden items-center gap-1 text-sm sm:flex"
              >
                <Link
                  href={
                    breadcrumb.section === "Overview"
                      ? "/dashboard"
                      : breadcrumb.section === "Management"
                        ? "/users"
                        : "/audit-logs"
                  }
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {breadcrumb.section}
                </Link>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
                <span className="font-medium text-foreground">
                  {breadcrumb.label}
                </span>
              </nav>
            )}
            {showLogo && <BrandLogo />}
          </div>

          <div className="flex items-center gap-3">
            <AnimatedThemeToggler
              theme={resolvedTheme === "dark" ? "dark" : "light"}
              onThemeChange={(newTheme) => setTheme(newTheme)}
              variant="circle"
            />

            {showSidebar &&
              (authLoading ? (
                <div
                  className="flex h-10 items-center gap-2 rounded-full border px-2"
                  role="status"
                  aria-label="Loading account information"
                >
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="hidden h-4 w-28 sm:block" />
                  <Skeleton className="size-4 rounded-sm" />
                </div>
              ) : (
                <div ref={menuRef} className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="flex items-center gap-2 rounded-full px-2 py-1.5 shadow-none"
                    aria-label="Open user menu"
                    title="Open user menu"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {userInitials}
                    </div>
                    <span className="hidden text-sm font-medium text-foreground sm:inline">
                      {userLabel}
                    </span>
                    <ChevronDown
                      aria-hidden="true"
                      className={`size-4 text-muted-foreground transition-transform ${
                        menuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-popover p-1 shadow-lg">
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        aria-busy={loggingOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted disabled:cursor-wait disabled:opacity-70"
                      >
                        {loggingOut ? (
                          <Spinner className="size-4" />
                        ) : (
                          <LogOut className="size-4" aria-hidden="true" />
                        )}
                        {loggingOut ? "Signing out..." : "Logout"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </header>
      {(loggingOut || isNavigating) && (
        <main
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-5 text-foreground"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <Spinner className="size-8 text-primary" />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">Signing out</h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we end your session...
              </p>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
