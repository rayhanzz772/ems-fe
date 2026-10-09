"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button, Card, Input, Label, Spinner } from "@/components/ui";
import { ApiError, getMe, login } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";

type AuthScreenProps = {
  mode: "login" | "register";
};

export function AuthScreen({ mode }: AuthScreenProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isRegister) return;

    let cancelled = false;

    void getMe()
      .then(() => {
        if (!cancelled) router.replace("/dashboard");
      })
      .catch(() => {
        // A missing session is the expected state on the login screen.
      });

    return () => {
      cancelled = true;
    };
  }, [isRegister, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isRegister) {
      setMessage("");
      setIsSubmitting(true);
      const formData = new FormData(event.currentTarget);
      try {
        await login(
          String(formData.get("email") ?? ""),
          String(formData.get("password") ?? ""),
        );
        setIsRedirecting(true);
        showSuccess("Signed in", "Welcome back to your account.");
        await new Promise((resolve) => window.setTimeout(resolve, 600));
        router.replace("/dashboard");
      } catch (error) {
        setIsRedirecting(false);
        setMessage(
          error instanceof ApiError
            ? error.message
            : "Unable to sign in. Please try again.",
        );
        showError(
          "Sign in failed",
          error instanceof Error ? error.message : undefined,
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setMessage("Your account form is ready to connect to an auth provider.");
  }

  if (isRedirecting) {
    return (
      <main
        className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-background px-5 text-foreground"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="size-8 text-primary" />
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">Signed in successfully</h1>
            <p className="text-sm text-muted-foreground">
              Preparing your dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <svg
          className="absolute inset-0 h-full w-full stroke-muted-foreground/20 [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_80%)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="subtle-grid-pattern"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
              x="50%"
              y="-1"
            >
              <path d="M.5 32V.5H32" fill="none" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            strokeWidth="0"
            fill="url(#subtle-grid-pattern)"
          />
        </svg>
      </div>
      <section className="flex w-full flex-1 items-center justify-center px-5 pb-10 pt-4">
        <div className="w-full max-w-[420px]">
          <Card className="px-6 py-7 shadow-sm sm:px-8 sm:py-8">
            <div className="mb-6 space-y-1.5 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {isRegister ? "Create an account" : "Welcome back"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRegister
                  ? "Start making room for what matters."
                  : "Enter your details to sign in to your account."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    required
                    placeholder="Alex Morgan"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    minLength={8}
                    required
                    placeholder="At least 8 characters"
                    className="pr-11"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="size-4" />
                    ) : (
                      <Eye aria-hidden="true" className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              {isRegister && (
                <label className="flex items-start gap-2.5 pt-1 text-xs leading-5 text-muted-foreground">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 size-3.5 accent-foreground"
                  />
                  <span>
                    I agree to the terms of service and privacy policy.
                  </span>
                </label>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting
                  ? "Signing in..."
                  : isRegister
                    ? "Create account"
                    : "Sign in"}
              </Button>
              <p
                role="status"
                aria-live="polite"
                className="text-center text-xs text-muted-foreground"
              >
                {message}
              </p>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {isRegister ? "Already have an account? " : "Forgot Passwrord? "}
              <Link
                href="/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {isRegister ? "Sign in" : "Call Admin"}
              </Link>
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
