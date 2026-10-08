const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function getAccessToken() {
  return typeof window === "undefined"
    ? null
    : window.localStorage.getItem("access_token");
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : `API request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};

export type AuthUser = {
  id: string;
  email: string;
  role: "ADMIN" | "HR" | "EMPLOYEE";
  status?: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  metadata: Record<string, unknown>;
  data: T;
};

export function getPaginationTotal(
  metadata: Record<string, unknown> | undefined,
  fallback: number,
) {
  const totalRow = metadata?.total_row;
  if (typeof totalRow === "number") return totalRow;
  return fallback;
}

export async function login(email: string, password: string) {
  const response = await api.post<ApiResponse<AuthUser>>("/auth/login", {
    email,
    password,
  });
  const data = response.data as AuthUser & {
    token?: string;
    access_token?: string;
  };
  const token = data.token ?? data.access_token;
  if (token && typeof window !== "undefined") {
    window.localStorage.setItem("access_token", token);
  }
  return response.data;
}

export async function getMe() {
  const response = await api.get<ApiResponse<AuthUser>>("/auth/get-me");
  return response.data;
}

export async function logout() {
  try {
    await api.post<ApiResponse<null>>("/auth/logout", {});
  } finally {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("access_token");
    }
  }
}

export type DashboardData = {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  employee_status: { active: number; inactive: number; total: number };
  employee_by_department: Array<{
    department_id: string;
    department_name: string;
    employee_count: number;
  }>;
  department_overview: Array<{
    department_name: string;
    employee_count: number;
  }>;
  recent_activity: Array<{
    id: string;
    action: string;
    entity: string;
    entity_id: string;
    user_email: string;
    created_at: string;
  }>;
};

export async function getDashboard() {
  const response = await api.get<ApiResponse<DashboardData>>("/dashboard");
  return response.data;
}
