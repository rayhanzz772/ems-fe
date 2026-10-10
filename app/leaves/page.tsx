"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api, type ApiResponse } from "@/lib/api";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  UsersRound,
  X,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Skeleton,
  Spinner,
  Textarea,
} from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { showError, showSuccess } from "@/lib/toast";

type LeaveStatus = "PENDING" | "APPROVED";
type StatusFilter = "ALL" | LeaveStatus;

type PersonSummary = {
  id?: string | number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
};

type LeaveType = {
  id: string;
  name: string;
  color: string;
  requires_balance: boolean;
};

type EmployeeOption = {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  status: boolean;
  employment_status: string;
};

type LeaveRequestApi = {
  id: string | number;
  employee_id?: string | number;
  leave_type_id?: string | number;
  start_date: string;
  end_date: string;
  duration_days: number | string;
  reason: string;
  status: LeaveStatus;
  decision_note?: string | null;
  decided_at?: string | null;
  employee?: PersonSummary | null;
  leave_type?: {
    id?: string | number;
    name?: string;
    color?: string;
    requires_balance?: boolean;
  } | null;
  approver?: PersonSummary | null;
  created_at?: string;
  updated_at?: string;
};

type LeaveCalendarData = LeaveRequestApi[] | { items?: LeaveRequestApi[] };
type LeaveTypeListData = LeaveType[] | { items?: LeaveType[] };
type EmployeeListData =
  EmployeeOption[] | { items?: EmployeeOption[]; employees?: EmployeeOption[] };

type LeaveEvent = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employee: string;
  leaveTypeId: string;
  type: string;
  color: string;
  requiresBalance: boolean;
  startDate: string;
  endDate: string;
  durationDays: number;
  status: LeaveStatus;
  reason: string;
  decisionNote: string;
  approver: string;
  decidedAt: string;
  createdAt: string;
};

type LeaveForm = {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  durationDays: string;
  reason: string;
};

const emptyForm: LeaveForm = {
  employeeId: "",
  leaveTypeId: "",
  startDate: "",
  endDate: "",
  durationDays: "",
  reason: "",
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getCalendarRange(days: Date[]) {
  return {
    startDate: toDateKey(days[0]),
    endDate: toDateKey(days[days.length - 1]),
  };
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  const date = dateFromKey(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", options).format(date);
}

function fullName(person?: PersonSummary | null) {
  return (
    [person?.first_name, person?.last_name].filter(Boolean).join(" ") ||
    "Unknown employee"
  );
}

function normalizeLeave(value: LeaveRequestApi): LeaveEvent {
  const durationDays = Number(value.duration_days);
  return {
    id: String(value.id),
    employeeId: String(value.employee_id ?? value.employee?.id ?? ""),
    employeeCode: value.employee?.employee_code ?? "",
    employee: fullName(value.employee),
    leaveTypeId: String(value.leave_type_id ?? value.leave_type?.id ?? ""),
    type: value.leave_type?.name ?? "Leave",
    color: value.leave_type?.color ?? "#2563EB",
    requiresBalance: value.leave_type?.requires_balance ?? false,
    startDate: value.start_date.slice(0, 10),
    endDate: value.end_date.slice(0, 10),
    durationDays: Number.isFinite(durationDays) ? durationDays : 0,
    status: value.status,
    reason: value.reason ?? "",
    decisionNote: value.decision_note ?? "",
    approver: fullName(value.approver),
    decidedAt: value.decided_at ?? "",
    createdAt: value.created_at ?? "",
  };
}

function normalizeEmployee(value: EmployeeOption): EmployeeOption {
  return {
    ...value,
    id: String(value.id),
    employee_code: value.employee_code ?? "",
    first_name: value.first_name ?? "",
    last_name: value.last_name ?? "",
    status: value.status ?? true,
    employment_status: value.employment_status ?? "ACTIVE",
  };
}

function dateIsValid(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) && toDateKey(dateFromKey(value)) === value
  );
}

function eventInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export default function LeavesPage() {
  const queryClient = useQueryClient();
  const { can, loading: authLoading } = useAuth();
  const canReadCalendar = can("leave_request.read");
  const canCreateRequest = can("leave_request.create");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [todayKey] = useState(() => toDateKey(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveEvent | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [deciding, setDeciding] = useState(false);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - offset);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [visibleMonth]);
  const range = getCalendarRange(calendarDays);

  const calendarQuery = useQuery({
    queryKey: [
      "leaves",
      "calendar",
      range.startDate,
      range.endDate,
      statusFilter,
    ],
    enabled: !authLoading && canReadCalendar,
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: range.startDate,
        end_date: range.endDate,
      });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const response = await api.get<ApiResponse<LeaveCalendarData>>(
        `/leaves/calendar?${params.toString()}`,
      );
      const data = response.data;
      const requests = Array.isArray(data) ? data : (data.items ?? []);
      return requests.map(normalizeLeave);
    },
    placeholderData: (previousData) => previousData,
  });

  const typeQuery = useQuery({
    queryKey: ["leave-types", "active"],
    enabled: !authLoading && canCreateRequest && can("leave_type.read"),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        per_page: "100",
        is_active: "true",
      });
      const response = await api.get<ApiResponse<LeaveTypeListData>>(
        `/leaves/types?${params.toString()}`,
      );
      const data = response.data;
      const types = Array.isArray(data) ? data : (data.items ?? []);
      return types.map((type) => ({ ...type, id: String(type.id) }));
    },
  });

  const employeeQuery = useQuery({
    queryKey: ["leaves", "eligible-employees"],
    enabled: !authLoading && canCreateRequest && can("employee.read"),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        per_page: "100",
        sort_by: "first_name",
        sort_order: "ASC",
        status: "true",
      });
      const response = await api.get<ApiResponse<EmployeeListData>>(
        `/employees?${params.toString()}`,
      );
      const data = response.data;
      const employees = Array.isArray(data)
        ? data
        : (data.items ?? data.employees ?? []);
      return employees
        .map(normalizeEmployee)
        .filter(
          (employee) =>
            employee.status && employee.employment_status === "ACTIVE",
        );
    },
  });

  const events = calendarQuery.data ?? [];
  const calendarError = calendarQuery.error
    ? calendarQuery.error instanceof ApiError
      ? calendarQuery.error.message
      : "Unable to load leave calendar."
    : "";
  const formDataError = typeQuery.error ?? employeeQuery.error;
  const formDataErrorMessage = formDataError
    ? formDataError instanceof ApiError
      ? formDataError.message
      : "Unable to load employees and leave types."
    : "";
  const selectedDayEvents = events.filter(
    (leave) => selectedDate >= leave.startDate && selectedDate <= leave.endDate,
  );
  const monthEvents = events.filter(
    (leave) =>
      leave.startDate.slice(0, 7) === toDateKey(visibleMonth).slice(0, 7) ||
      leave.endDate.slice(0, 7) === toDateKey(visibleMonth).slice(0, 7) ||
      (leave.startDate < range.startDate && leave.endDate > range.endDate),
  );
  const upcomingEvents = events
    .filter((leave) => leave.endDate >= todayKey)
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
  const approvedCount = monthEvents.filter(
    (leave) => leave.status === "APPROVED",
  ).length;
  const pendingCount = monthEvents.filter(
    (leave) => leave.status === "PENDING",
  ).length;

  function changeMonth(offset: number) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }

  function openCreate(date = selectedDate) {
    setSelectedDate(date);
    setForm({ ...emptyForm, startDate: date, endDate: date });
    setFormError("");
    setFormOpen(true);
  }

  async function saveLeave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setFormError("");

    const durationDays = Number(form.durationDays);
    if (!form.employeeId || !form.leaveTypeId) {
      setFormError("Select an employee and leave type.");
      return;
    }
    if (!dateIsValid(form.startDate) || !dateIsValid(form.endDate)) {
      setFormError("Enter valid start and end dates.");
      return;
    }
    if (form.endDate < form.startDate) {
      setFormError("End date cannot be earlier than start date.");
      return;
    }
    if (
      !Number.isFinite(durationDays) ||
      durationDays <= 0 ||
      durationDays > 999.99
    ) {
      setFormError(
        "Duration must be greater than 0 and no more than 999.99 days.",
      );
      return;
    }
    const reason = form.reason.trim();
    if (!reason) {
      setFormError("Reason is required.");
      return;
    }
    if (!canCreateRequest) {
      setFormError("You do not have permission to create leave requests.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/leaves/requests/create", {
        employee_id: form.employeeId,
        leave_type_id: form.leaveTypeId,
        start_date: form.startDate,
        end_date: form.endDate,
        duration_days: durationDays,
        reason,
      });
      setFormOpen(false);
      setSelectedDate(form.startDate);
      setVisibleMonth(dateFromKey(form.startDate));
      showSuccess("Leave request submitted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leaves", "calendar"] }),
        queryClient.invalidateQueries({ queryKey: ["leaves", "requests"] }),
        queryClient.invalidateQueries({ queryKey: ["leaves", "balances"] }),
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to submit leave request.";
      setFormError(message);
      showError("Unable to submit leave request", message);
      if (requestError instanceof ApiError && requestError.status === 409) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["leaves", "calendar"] }),
          queryClient.invalidateQueries({ queryKey: ["leaves", "requests"] }),
          queryClient.invalidateQueries({ queryKey: ["leaves", "balances"] }),
        ]);
      }
    } finally {
      setSaving(false);
    }
  }

  async function openRequestDetail(leave: LeaveEvent) {
    setSelectedRequest(leave);
    setDetailLoading(true);
    setDetailError("");
    setDecisionError("");
    setDecisionNote("");
    try {
      const response = await api.get<ApiResponse<LeaveRequestApi>>(
        `/leaves/requests/${encodeURIComponent(leave.id)}/detail`,
      );
      setSelectedRequest(normalizeLeave(response.data));
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to load leave request details.";
      setDetailError(message);
      showError("Unable to load leave request details", message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function decideRequest(status: "APPROVED" | "REJECTED") {
    if (
      !selectedRequest ||
      selectedRequest.status !== "PENDING" ||
      !can("leave_request.decide") ||
      deciding
    ) {
      return;
    }

    setDecisionError("");
    setDeciding(true);
    try {
      await api.patch(
        `/leaves/requests/${encodeURIComponent(selectedRequest.id)}/decision`,
        {
          status,
          decision_note: decisionNote.trim() || undefined,
        },
      );
      showSuccess(
        status === "APPROVED"
          ? "Leave request approved"
          : "Leave request rejected",
      );
      setSelectedRequest(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leaves", "calendar"] }),
        queryClient.invalidateQueries({ queryKey: ["leaves", "requests"] }),
        queryClient.invalidateQueries({ queryKey: ["leaves", "balances"] }),
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : `Unable to ${status === "APPROVED" ? "approve" : "reject"} leave request.`;
      setDecisionError(message);
      showError(
        status === "APPROVED"
          ? "Unable to approve leave request"
          : "Unable to reject leave request",
        message,
      );
      if (requestError instanceof ApiError && requestError.status === 409) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["leaves", "calendar"] }),
          queryClient.invalidateQueries({ queryKey: ["leaves", "requests"] }),
          queryClient.invalidateQueries({ queryKey: ["leaves", "balances"] }),
        ]);
      }
    } finally {
      setDeciding(false);
    }
  }

  if (authLoading) return null;
  if (!canReadCalendar) {
    return (
      <main className="mx-auto w-full max-w-5xl p-5 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view the leave calendar.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const activeEmployees = employeeQuery.data ?? [];
  const activeLeaveTypes = typeQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Leave calendar
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View scheduled time off and submit leave requests for your team.
          </p>
        </div>
        {canCreateRequest && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => openCreate()}
            disabled={!can("employee.read") || !can("leave_type.read")}
          >
            <Plus /> Add leave request
          </Button>
        )}
      </section>

      {calendarError && (
        <p
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {calendarError}
        </p>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0">
          <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{formatMonth(visibleMonth)}</CardTitle>
              <CardDescription>
                Select a date to see who is away or add a leave request.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter calendar by status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setVisibleMonth(
                    new Date(today.getFullYear(), today.getMonth(), 1),
                  );
                  setSelectedDate(todayKey);
                }}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-5">
            {calendarQuery.isPending ? (
              <div className="grid grid-cols-7 border-l border-t">
                {Array.from({ length: 49 }, (_, index) => (
                  <div
                    key={index}
                    className="min-h-24 border-b border-r p-2 sm:min-h-32"
                  >
                    <Skeleton className="size-6 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 border-l border-t">
                {weekdays.map((day) => (
                  <div
                    key={day}
                    className="border-b border-r bg-muted/40 px-1 py-2 text-center text-xs font-medium text-muted-foreground sm:py-3 sm:text-sm"
                  >
                    {day}
                  </div>
                ))}
                {calendarDays.map((date) => {
                  const dateKey = toDateKey(date);
                  const inMonth = date.getMonth() === visibleMonth.getMonth();
                  const dayEvents = events.filter(
                    (leave) =>
                      dateKey >= leave.startDate && dateKey <= leave.endDate,
                  );
                  const isSelected = dateKey === selectedDate;
                  return (
                    <button
                      type="button"
                      key={dateKey}
                      onClick={() => setSelectedDate(dateKey)}
                      onDoubleClick={() =>
                        canCreateRequest && openCreate(dateKey)
                      }
                      aria-label={`${formatDate(dateKey, { weekday: "long", month: "long", day: "numeric" })}, ${dayEvents.length} leave requests`}
                      aria-pressed={isSelected}
                      className={`group min-h-24 min-w-0 border-b border-r p-1.5 text-left transition-colors hover:bg-muted/50 sm:min-h-32 sm:p-2 ${
                        isSelected
                          ? "bg-primary/5 ring-1 ring-inset ring-primary"
                          : ""
                      } ${!inMonth ? "bg-muted/20 text-muted-foreground" : ""}`}
                    >
                      <span
                        className={`inline-flex size-7 items-center justify-center rounded-full text-xs sm:text-sm ${
                          dateKey === todayKey
                            ? "bg-primary font-semibold text-primary-foreground"
                            : "font-medium"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      <span className="mt-1 flex flex-col gap-1">
                        {dayEvents.slice(0, 2).map((leave) => (
                          <span
                            key={`${dateKey}-${leave.id}`}
                            title={`${leave.employee} · ${leave.type} · ${leave.status}`}
                            className="truncate rounded border-l-2 px-1 py-0.5 text-[10px] leading-4 sm:text-xs"
                            style={{
                              borderLeftColor: leave.color,
                              backgroundColor: `${leave.color}1A`,
                            }}
                          >
                            <span className="hidden sm:inline">
                              {leave.employee}
                            </span>
                            <span className="sm:hidden">
                              {leave.employee.split(" ")[0]}
                            </span>
                          </span>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="px-1 text-[10px] text-muted-foreground sm:text-xs">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </span>
                      {canCreateRequest && (
                        <span className="mt-1 hidden text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                          Double-click to add
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                Approved
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500" />
                Pending
              </span>
              {canCreateRequest && (
                <span className="ml-auto">
                  Double-click a date to add a leave request
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  {formatDate(selectedDate, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </CardTitle>
                <CardDescription>
                  {selectedDayEvents.length
                    ? `${selectedDayEvents.length} ${selectedDayEvents.length === 1 ? "request overlaps" : "requests overlap"} this date`
                    : "No leave scheduled"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {calendarQuery.isPending &&
                Array.from({ length: 2 }, (_, index) => (
                  <LeaveCardSkeleton key={index} />
                ))}
              {!calendarQuery.isPending &&
                selectedDayEvents.map((leave) => (
                  <LeaveCard
                    key={leave.id}
                    leave={leave}
                    onClick={() => void openRequestDetail(leave)}
                  />
                ))}
              {!calendarQuery.isPending && !selectedDayEvents.length && (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <CalendarDays className="size-5" />
                  {canCreateRequest ? (
                    <button
                      type="button"
                      onClick={() => openCreate(selectedDate)}
                      className="hover:text-foreground"
                      disabled={
                        !can("employee.read") || !can("leave_type.read")
                      }
                    >
                      Add a leave request for this day
                    </button>
                  ) : (
                    <span>No leave scheduled on this date.</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming leave</CardTitle>
              <CardDescription>
                Requests in the visible calendar range
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {calendarQuery.isPending &&
                Array.from({ length: 4 }, (_, index) => (
                  <UpcomingLeaveSkeleton key={index} />
                ))}
              {!calendarQuery.isPending &&
                upcomingEvents.slice(0, 6).map((leave) => (
                  <button
                    type="button"
                    key={leave.id}
                    onClick={() => void openRequestDetail(leave)}
                    className="w-full rounded-lg border border-l-4 p-3 text-left transition-colors hover:bg-muted/50"
                    style={{ borderLeftColor: leave.color }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {leave.employee}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {leave.type} · {leave.durationDays} days
                        </p>
                      </div>
                      <StatusBadge status={leave.status} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(leave.startDate)}
                      {leave.endDate !== leave.startDate &&
                        ` – ${formatDate(leave.endDate)}`}
                    </p>
                  </button>
                ))}
              {!upcomingEvents.length && !calendarQuery.isPending && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No upcoming leave requests.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => {
          if (!open && !deciding) {
            setSelectedRequest(null);
            setDecisionError("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leave request details</DialogTitle>
            <DialogDescription>
              Review the request details and decide whether to approve it.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-5">
              {detailLoading ? (
                <div
                  className="space-y-4"
                  role="status"
                  aria-label="Loading leave request details"
                >
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      style={{
                        color: selectedRequest.color,
                        backgroundColor: `${selectedRequest.color}1A`,
                      }}
                    >
                      {eventInitials(selectedRequest.employee)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {selectedRequest.employee}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.employeeCode || "Employee"}
                      </p>
                    </div>
                    <StatusBadge status={selectedRequest.status} />
                  </div>

                  <div className="grid gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
                    <DetailField
                      label="Leave type"
                      value={selectedRequest.type}
                    />
                    <DetailField
                      label="Duration"
                      value={`${selectedRequest.durationDays} days`}
                    />
                    <DetailField
                      label="Start date"
                      value={formatDate(selectedRequest.startDate, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    />
                    <DetailField
                      label="End date"
                      value={formatDate(selectedRequest.endDate, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    />
                    <DetailField
                      label="Approver"
                      value={selectedRequest.approver}
                    />
                    <DetailField
                      label="Decision time"
                      value={
                        selectedRequest.decidedAt
                          ? new Date(selectedRequest.decidedAt).toLocaleString(
                              "id-ID",
                            )
                          : "Not decided"
                      }
                    />
                    <div className="sm:col-span-2">
                      <DetailField
                        label="Reason"
                        value={selectedRequest.reason}
                      />
                    </div>
                    {selectedRequest.decisionNote && (
                      <div className="sm:col-span-2">
                        <DetailField
                          label="Decision note"
                          value={selectedRequest.decisionNote}
                        />
                      </div>
                    )}
                  </div>

                  {detailError && (
                    <p
                      className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      {detailError}
                    </p>
                  )}
                  {decisionError && (
                    <p
                      className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      {decisionError}
                    </p>
                  )}

                  {selectedRequest.status === "PENDING" &&
                    can("leave_request.decide") && (
                      <div className="space-y-2">
                        <Label htmlFor="leave-decision-note">
                          Decision note (optional)
                        </Label>
                        <Textarea
                          id="leave-decision-note"
                          maxLength={255}
                          rows={3}
                          value={decisionNote}
                          onChange={(event) =>
                            setDecisionNote(event.target.value)
                          }
                          placeholder="Add a note for this decision"
                        />
                      </div>
                    )}

                  <DialogFooter>
                    {selectedRequest.status === "PENDING" &&
                      can("leave_request.decide") && (
                        <>
                          <Button
                            variant="destructive"
                            onClick={() => void decideRequest("REJECTED")}
                            disabled={deciding || detailLoading}
                          >
                            {deciding ? <Spinner /> : <X />}
                            {deciding ? "Saving..." : "Reject"}
                          </Button>
                          <Button
                            onClick={() => void decideRequest("APPROVED")}
                            disabled={deciding || detailLoading}
                          >
                            {deciding ? <Spinner /> : <Check />}
                            {deciding ? "Saving..." : "Approve"}
                          </Button>
                        </>
                      )}
                    <DialogClose
                      render={<Button variant="outline" disabled={deciding} />}
                    >
                      Close
                    </DialogClose>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!saving) setFormOpen(open);
          if (!open) setFormError("");
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit leave request</DialogTitle>
            <DialogDescription>
              Select an employee and leave type, then enter the request dates
              and duration.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveLeave} className="space-y-4">
            {formError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </p>
            )}
            {formDataErrorMessage && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formDataErrorMessage}
              </p>
            )}
            {!can("employee.read") && (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                Employee read permission is required to choose an employee.
              </p>
            )}
            {!can("leave_type.read") && (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                Leave type read permission is required to choose a leave type.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="leave-employee">Employee</Label>
              <select
                id="leave-employee"
                required
                value={form.employeeId}
                onChange={(event) =>
                  setForm({ ...form, employeeId: event.target.value })
                }
                disabled={!activeEmployees.length || employeeQuery.isPending}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select employee</option>
                {activeEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                    {employee.employee_code
                      ? ` (${employee.employee_code})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-type">Leave type</Label>
              <select
                id="leave-type"
                required
                value={form.leaveTypeId}
                onChange={(event) =>
                  setForm({ ...form, leaveTypeId: event.target.value })
                }
                disabled={!activeLeaveTypes.length || typeQuery.isPending}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select leave type</option>
                {activeLeaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                    {type.requires_balance ? " · balance required" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="leave-start">Start date</Label>
                <Input
                  id="leave-start"
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(event) =>
                    setForm({ ...form, startDate: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leave-end">End date</Label>
                <Input
                  id="leave-end"
                  type="date"
                  required
                  min={form.startDate || undefined}
                  value={form.endDate}
                  onChange={(event) =>
                    setForm({ ...form, endDate: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-duration">Duration (days)</Label>
              <Input
                id="leave-duration"
                type="number"
                required
                min="0.01"
                max="999.99"
                step="0.01"
                value={form.durationDays}
                onChange={(event) =>
                  setForm({ ...form, durationDays: event.target.value })
                }
                placeholder="Enter duration based on your leave policy"
              />
              <p className="text-xs text-muted-foreground">
                Enter the duration explicitly. Working days and holidays are not
                calculated automatically.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leave-reason">Reason</Label>
              <Textarea
                id="leave-reason"
                required
                maxLength={255}
                rows={3}
                value={form.reason}
                onChange={(event) =>
                  setForm({ ...form, reason: event.target.value })
                }
                placeholder="Reason for the leave request"
              />
            </div>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline" disabled={saving} />}
              >
                Cancel
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  saving ||
                  !canCreateRequest ||
                  !can("employee.read") ||
                  !can("leave_type.read") ||
                  employeeQuery.isPending ||
                  typeQuery.isPending
                }
              >
                {saving && <Spinner />}
                {saving ? "Submitting..." : "Submit request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={`flex size-11 items-center justify-center rounded-xl ${color}`}
        >
          {icon}
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: LeaveStatus }) {
  const approved = status === "APPROVED";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${
        approved
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }`}
    >
      {approved ? "Approved" : "Pending"}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value || "—"}</p>
    </div>
  );
}

function LeaveCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function UpcomingLeaveSkeleton() {
  return (
    <div className="space-y-2 rounded-lg p-3">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

function LeaveCard({
  leave,
  onClick,
}: {
  leave: LeaveEvent;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${leave.employee}'s ${leave.type} request details`}
      className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{
          color: leave.color,
          backgroundColor: `${leave.color}1A`,
        }}
      >
        {eventInitials(leave.employee)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium">{leave.employee}</p>
          <StatusBadge status={leave.status} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {leave.employeeCode && `${leave.employeeCode} · `}
          {leave.type} · {leave.durationDays} days
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {formatDate(leave.startDate)}
          {leave.startDate !== leave.endDate &&
            ` – ${formatDate(leave.endDate)}`}
        </p>
        {leave.reason && (
          <p className="mt-2 text-sm text-muted-foreground">{leave.reason}</p>
        )}
        {leave.decisionNote && (
          <p className="mt-2 border-l-2 pl-2 text-xs text-muted-foreground">
            {leave.decisionNote}
          </p>
        )}
      </div>
    </button>
  );
}
