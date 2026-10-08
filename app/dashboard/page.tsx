"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  IdCardLanyard,
  Plus,
  ShieldCheck,
  UserPlus,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui";

const departmentData = [
  { name: "Engineering", employees: 42 },
  { name: "Marketing", employees: 26 },
  { name: "Finance", employees: 18 },
  { name: "People", employees: 12 },
];

const statusData = [
  { name: "Active", value: 116, fill: "var(--color-active)" },
  { name: "Inactive", value: 12, fill: "var(--color-inactive)" },
];

const departmentConfig = {
  employees: { label: "Employees", color: "var(--chart-2)" },
} satisfies ChartConfig;

const statusConfig = {
  active: { label: "Active", color: "var(--chart-2)" },
  inactive: { label: "Inactive", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const recentActivities = [
  {
    text: "Admin created a new employee",
    user: "alya.pratama@morrow.co",
    time: "2 minutes ago",
    icon: UserPlus,
  },
  {
    text: "HR updated user status",
    user: "nadia.hr@morrow.co",
    time: "18 minutes ago",
    icon: CheckCircle2,
  },
  {
    text: "Admin updated department details",
    user: "admin@morrow.co",
    time: "1 hour ago",
    icon: Building2,
  },
  {
    text: "Admin changed an employee profile",
    user: "admin@morrow.co",
    time: "3 hours ago",
    icon: IdCardLanyard,
  },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Workspace / Overview
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Good morning, John
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your organization today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} variant="outline" render={<Link href="/audit-log" />}>
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
                Active <strong>116</strong>
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-muted-foreground" />
                Inactive <strong>12</strong>
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
            {departmentData.map((department) => (
              <div
                key={department.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-4" />
                  </span>
                  <span className="text-sm font-medium">{department.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {department.employees} employees
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
              render={<Link href="/audit-log" />}
            >
              View all <ArrowUpRight />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map(({ text, user, time, icon: Icon }) => (
              <div key={`${text}-${time}`} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{text}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user} · {time}
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
