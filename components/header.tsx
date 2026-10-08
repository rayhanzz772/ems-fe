"use client";

import { ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ApiError, getMe, logout } from "@/lib/api";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userLoadError, setUserLoadError] = useState<string | null>(null);

  const showSidebar =
    pathname === "/dashboard" ||
    pathname === "/user" ||
    pathname === "/department" ||
    pathname === "/employee" ||
    pathname === "/audit-log" ||
    pathname === "/audit-logs" ||
    pathname === "/api-docs";
  const showLogo = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!showSidebar) {
      return;
    }

    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const user = await getMe();
        if (!cancelled) {
          setUserEmail(user.email);
          setUserLoadError(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login");
          return;
        }

        setUserLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load the current user.",
        );
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [router, showSidebar]);

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
    setMenuOpen(false);
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  };

  const userInitials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "--";
  const userLabel = userEmail ?? (userLoadError ? "Unavailable" : "Loading...");

  return (
    <header className="z-10 h-16 w-full shrink-0 border-b bg-background">
      <div className="mx-auto flex h-full w-full items-center justify-between px-5">
        <div className="flex items-center gap-2">
          {showSidebar && <SidebarTrigger title="Toggle navigation" />}
          {showLogo && <BrandLogo />}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            variant="outline"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Toggle color theme"
            title="Toggle color theme"
          >
            <Sun aria-hidden="true" className="hidden size-4 dark:block" />
            <Moon aria-hidden="true" className="size-4 dark:hidden" />
          </Button>

          {showSidebar && (
            <div ref={menuRef} className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full px-2 py-1.5 shadow-none"
                aria-label="Open user menu"
                title={userLoadError ?? "Open user menu"}
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
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
