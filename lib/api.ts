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
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("access_token");
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured. Add it to .env.local and restart the dev server.",
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = getAccessToken();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
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
    apiRequest<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) =>
    apiRequest<T>(path, {
      method: "DELETE",
    }),
};
