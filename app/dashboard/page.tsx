"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Plus,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui";
import { ApiError, getDashboard, type DashboardData } from "@/lib/api";

const departmentConfig = {
  employees: { label: "Employees", color: "var(--chart-2)" },
} satisfies ChartConfig;

const statusConfig = {
  active: { label: "Active", color: "var(--chart-2)" },
  inactive: { label: "Inactive", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

function formatActivityDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function activityLabel(action: string, entity: string) {
  return `${action.charAt(0)}${action.slice(1).toLowerCase()} ${entity.toLowerCase()}`;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const data = await getDashboard();
        if (!cancelled) setDashboard(data);
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : "Unable to load dashboard data.",
          );
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main className="mx-auto w-full max-w-[1600px] p-5 md:p-8">
        <Card>
          <CardContent className="p-6">
            <p className="font-medium">Unable to load dashboard</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
        <section className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-36" />
              </CardContent>
            </Card>
          ))}
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-3">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-64 max-w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }, (_, row) => (
                  <div key={row} className="flex items-center gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    );
  }

  const departmentData = dashboard.employee_by_department.map((department) => ({
    name: department.department_name,
    employees: department.employee_count,
  }));
  const statusData = [
    {
      name: "Active",
      value: dashboard.employee_status.active,
      fill: "var(--color-active)",
    },
    {
      name: "Inactive",
      value: dashboard.employee_status.inactive,
      fill: "var(--color-inactive)",
    },
  ];
  const activePercentage = dashboard.employee_status.total
    ? Math.round(
        (dashboard.active_employees / dashboard.employee_status.total) * 100,
      )
    : 0;

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Good morning
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your organization today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href="/audit-logs" />}
          >
            <Activity /> View activity
          </Button>
          <Button nativeButton={false} render={<Link href="/employee" />}>
            <Plus /> Add employee
          </Button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Employees by department</CardTitle>
            <CardDescription>
              Current employee distribution across departments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={departmentConfig}
              className="h-[280px] w-full"
            >
              <BarChart
                data={departmentData}
                margin={{ left: 4, right: 12, top: 12 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis tickLine={false} axisLine={false} width={30} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="employees"
                  fill="var(--color-employees)"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Employee status</CardTitle>
            <CardDescription>Active versus inactive employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={statusConfig}
              className="mx-auto h-[280px] w-full max-w-[360px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={104}
                  strokeWidth={4}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex justify-center gap-6 text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[var(--chart-2)]" />
                Active <strong>{dashboard.employee_status.active}</strong>
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-muted-foreground" />
                Inactive <strong>{dashboard.employee_status.inactive}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Department overview</CardTitle>
              <CardDescription>Team size by department.</CardDescription>
            </div>
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              render={<Link href="/department" />}
            >
              View all <ArrowUpRight />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.department_overview.map((department) => (
              <div
                key={department.department_name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-4" />
                  </span>
                  <span className="text-sm font-medium">
                    {department.department_name}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {department.employee_count} employees
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>
                Latest changes in your workspace.
              </CardDescription>
            </div>
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              render={<Link href="/audit-logs" />}
            >
              View all <ArrowUpRight />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.recent_activity.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Activity className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {activityLabel(activity.action, activity.entity)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {activity.user_email} ·{" "}
                    {formatActivityDate(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
