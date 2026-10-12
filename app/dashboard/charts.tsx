"use client";

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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const departmentConfig = {
  employees: { label: "Employees", color: "var(--chart-1)" },
} satisfies ChartConfig;

const statusConfig = {
  active: { label: "Active", color: "rgba(36, 188, 92, 0.8)" },
  inactive: { label: "Inactive", color: "rgba(249, 115, 22, 0.8)" },
} satisfies ChartConfig;

const branchConfig = {
  employees: { label: "Employees", color: "var(--chart-2)" },
} satisfies ChartConfig;

const leaveStatusConfig = {
  pending: { label: "Pending", color: "rgba(245, 158, 11, 0.8)" },
  approved: { label: "Approved", color: "rgba(36, 188, 92, 0.8)" },
  rejected: { label: "Rejected", color: "rgba(239, 68, 68, 0.8)" },
  cancelled: { label: "Cancelled", color: "rgba(100, 116, 139, 0.8)" },
} satisfies ChartConfig;

const leaveTypeConfig = {
  days: { label: "Days", color: "var(--chart-1)" },
} satisfies ChartConfig;

type CategoryDatum = { name: string; employees: number; fill: string };
type ValueDatum = { name: string; value: number; fill: string };
type LeaveTypeDatum = { name: string; days: number; fill: string };

export function DepartmentChart({ data }: { data: CategoryDatum[] }) {
  return (
    <ChartContainer config={departmentConfig} className="h-[280px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 12, top: 12 }}>
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
        <Bar dataKey="employees" radius={[5, 5, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function EmployeeStatusChart({ data }: { data: ValueDatum[] }) {
  return (
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
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={72}
          outerRadius={104}
          strokeWidth={4}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

export function BranchChart({ data }: { data: CategoryDatum[] }) {
  return (
    <ChartContainer config={branchConfig} className="h-[280px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 12, top: 12 }}>
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
        <Bar dataKey="employees" radius={[5, 5, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function LeaveStatusChart({ data }: { data: ValueDatum[] }) {
  return (
    <ChartContainer
      config={leaveStatusConfig}
      className="mx-auto h-[280px] w-full max-w-[360px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={72}
          outerRadius={104}
          strokeWidth={4}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

export function LeaveTypeChart({ data }: { data: LeaveTypeDatum[] }) {
  return (
    <ChartContainer config={leaveTypeConfig} className="h-[280px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 16, top: 12 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Bar dataKey="days" radius={[0, 5, 5, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
