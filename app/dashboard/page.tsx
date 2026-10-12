"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  Building2,
  CalendarDays,
  CalendarX2,
  Pencil,
  Plus,
  SquarePen,
  Trash,
  Users,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import {
  ApiError,
  getDashboard,
  type DashboardData,
  type DashboardLeaveEntry,
} from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { AccessDenied } from "@/components/access-denied";

function ChartFallback() {
  return <Skeleton className="h-[280px] w-full rounded-xl" />;
}

const DepartmentChart = dynamic(
  () => import("./charts").then((mod) => mod.DepartmentChart),
  { ssr: false, loading: ChartFallback },
);

const EmployeeStatusChart = dynamic(
  () => import("./charts").then((mod) => mod.EmployeeStatusChart),
  { ssr: false, loading: ChartFallback },
);

const BranchChart = dynamic(
  () => import("./charts").then((mod) => mod.BranchChart),
  { ssr: false, loading: ChartFallback },
);

const LeaveStatusChart = dynamic(
  () => import("./charts").then((mod) => mod.LeaveStatusChart),
  { ssr: false, loading: ChartFallback },
);

const LeaveTypeChart = dynamic(
  () => import("./charts").then((mod) => mod.LeaveTypeChart),
  { ssr: false, loading: ChartFallback },
);

const departmentColors = [
  "rgba(37, 99, 235, 0.8)",
  "rgba(124, 58, 237, 0.8)",
  "rgba(219, 39, 119, 0.8)",
  "rgba(8, 145, 178, 0.8)",
  "rgba(22, 163, 74, 0.8)",
  "rgba(202, 138, 4, 0.8)",
];

const activityDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatActivityDate(date: string) {
  return activityDateFormatter.format(new Date(date));
}

function activityLabel(action: string, entity: string) {
  return `${action.charAt(0)}${action.slice(1).toLowerCase()} ${entity.toLowerCase()}`;
}

const dateKeyFormatters = new Map<string, Intl.DateTimeFormat>();

function formatDateKey(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;

  const key = JSON.stringify(options);
  let formatter = dateKeyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", options);
    dateKeyFormatters.set(key, formatter);
  }
  return formatter.format(date);
}

function formatDateRange(startDate: string, endDate: string) {
  return startDate === endDate
    ? formatDateKey(startDate)
    : `${formatDateKey(startDate)} – ${formatDateKey(endDate)}`;
}

const activityVisuals = {
  CREATE: {
    icon: Pencil,
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
  UPDATE: {
    icon: SquarePen,
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
  },
  DELETE: {
    icon: Trash,
    className: "bg-red-500/15 text-red-600 dark:text-red-300",
  },
} satisfies Record<
  "CREATE" | "UPDATE" | "DELETE",
  { icon: typeof Pencil; className: string }
>;

function getActivityVisual(action: string) {
  return (
    activityVisuals[action as keyof typeof activityVisuals] ??
    activityVisuals.UPDATE
  );
}

export default function DashboardPage() {
  const { can, loading: authLoading } = useAuth();
  const dashboardQuery = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    enabled: !authLoading && can("dashboard.read"),
  });

  if (authLoading) return null;
  if (!can("dashboard.read")) {
    return <AccessDenied />;
  }

  const dashboard = dashboardQuery.data;
  const error =
    dashboardQuery.error instanceof ApiError
      ? dashboardQuery.error.message
      : dashboardQuery.error
        ? "Unable to load dashboard data."
        : "";

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

  const departmentData = dashboard.employee_by_department.map(
    (department, index) => ({
      name: department.department_name,
      employees: department.employee_count,
      fill: departmentColors[index % departmentColors.length],
    }),
  );
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
  const branchData = dashboard.employee_by_branch.map((branch, index) => ({
    name: branch.branch_name,
    employees: branch.employee_count,
    fill: departmentColors[index % departmentColors.length],
  }));
  const leaveStatusData = [
    {
      name: "Pending",
      value: dashboard.leave_status.pending,
      fill: "var(--color-pending)",
    },
    {
      name: "Approved",
      value: dashboard.leave_status.approved,
      fill: "var(--color-approved)",
    },
    {
      name: "Rejected",
      value: dashboard.leave_status.rejected,
      fill: "var(--color-rejected)",
    },
    {
      name: "Cancelled",
      value: dashboard.leave_status.cancelled,
      fill: "var(--color-cancelled)",
    },
  ];
  const leaveByTypeData = dashboard.approved_leave_by_type.map((type) => ({
    name: type.leave_type,
    days: type.total_days,
    requests: type.total_requests,
    fill: type.color,
  }));
  const onLeaveToday = dashboard.employees_on_leave_today.employees;
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome Back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your organization today.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {can("audit_log.read") && (
            <Button
              nativeButton={false}
              variant="outline"
              className="w-full sm:w-auto"
              render={<Link href="/audit-logs" />}
            >
              <Activity /> View activity
            </Button>
          )}
          {can("employee.create") && (
            <Button
              className="w-full sm:w-auto"
              nativeButton={false}
              render={<Link href="/employees" />}
            >
              <Plus /> Add employee
            </Button>
          )}
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
            <DepartmentChart data={departmentData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Employee status</CardTitle>
            <CardDescription>Active versus inactive employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeStatusChart data={statusData} />
            <div className="flex justify-center gap-6 text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#22c55e]" />
                Active <strong>{dashboard.employee_status.active}</strong>
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#f97316]" />
                Inactive <strong>{dashboard.employee_status.inactive}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Employees by branch</CardTitle>
            <CardDescription>
              Current employee distribution across branches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {branchData.length ? (
              <BranchChart data={branchData} />
            ) : (
              <EmptyState message="No branch data yet." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leave requests</CardTitle>
            <CardDescription>
              Requests by status across all types.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.leave_status.total ? (
              <>
                <LeaveStatusChart data={leaveStatusData} />
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                  {leaveStatusData.map((entry) => (
                    <span key={entry.name} className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: entry.fill }}
                      />
                      {entry.name} <strong>{entry.value}</strong>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState message="No leave requests yet." />
            )}
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
              render={<Link href="/departments" />}
            >
              View all <ArrowUpRight />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.department_overview.map((department, index) => (
              <div
                key={department.department_name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-8 items-center justify-center rounded-lg text-white"
                    style={{
                      backgroundColor:
                        departmentColors[index % departmentColors.length],
                    }}
                  >
                    {department.department_name[0]?.toUpperCase()}
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
                {(() => {
                  const visual = getActivityVisual(activity.action);
                  const ActivityIcon = visual.icon;

                  return (
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${visual.className}`}
                    >
                      <ActivityIcon className="size-4" />
                    </span>
                  );
                })()}
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

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>On leave today</CardTitle>
            <CardDescription>
              {dashboard.employees_on_leave_today.total
                ? `${dashboard.employees_on_leave_today.total} employee${dashboard.employees_on_leave_today.total === 1 ? "" : "s"} away today.`
                : "Everyone is available today."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {onLeaveToday.length ? (
              onLeaveToday.map((leave) => (
                <LeaveRequestRow key={leave.id} leave={leave} />
              ))
            ) : (
              <EmptyState message="No one is on leave today." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming leave</CardTitle>
              <CardDescription>Scheduled time off ahead.</CardDescription>
            </div>
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              render={<Link href="/leaves" />}
            >
              View all <ArrowUpRight />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.upcoming_leaves.length ? (
              dashboard.upcoming_leaves
                .slice(0, 5)
                .map((leave) => (
                  <LeaveRequestRow key={leave.id} leave={leave} />
                ))
            ) : (
              <EmptyState message="No upcoming leave scheduled." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Approved leave by type</CardTitle>
            <CardDescription>
              Total approved days per leave type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaveByTypeData.some((type) => type.days > 0) ? (
              <LeaveTypeChart data={leaveByTypeData} />
            ) : (
              <EmptyState message="No approved leave yet." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Headcount by position</CardTitle>
              <CardDescription>
                Employees assigned per position.
              </CardDescription>
            </div>
            <Button
              nativeButton={false}
              variant="ghost"
              size="sm"
              render={<Link href="/positions" />}
            >
              View all <ArrowUpRight />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.employee_by_position.length ? (
              dashboard.employee_by_position.map((position, index) => (
                <div
                  key={position.position_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-8 items-center justify-center rounded-lg text-white"
                      style={{
                        backgroundColor:
                          departmentColors[index % departmentColors.length],
                      }}
                    >
                      {position.position_name[0]?.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium">
                      {position.position_name}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {position.employee_count} employees
                  </span>
                </div>
              ))
            ) : (
              <EmptyState message="No positions yet." />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${className}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {hint && (
            <p className="truncate text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="flex h-full min-h-24 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

function employeeInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function LeaveRequestRow({ leave }: { leave: DashboardLeaveEntry }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
        style={{
          color: leave.leave_type_color,
          backgroundColor: `${leave.leave_type_color}1A`,
        }}
      >
        {employeeInitials(leave.employee_name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{leave.employee_name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {leave.leave_type} · {leave.duration_days} days
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateRange(leave.start_date, leave.end_date)}
        </p>
      </div>
    </div>
  );
}
