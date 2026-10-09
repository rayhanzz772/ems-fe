import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

function rewriteSessionCookie(cookie: string) {
  const parts = cookie
    .split(";")
    .map((part) => part.trim())
    .filter(
      (part) =>
        !/^domain=/i.test(part) &&
        !/^samesite=/i.test(part) &&
        !/^path=/i.test(part),
    );

  parts.push("Path=/", "SameSite=Lax");
  return parts.join("; ");
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
  if (!API_URL) {
    return NextResponse.json(
      { success: false, message: "NEXT_PUBLIC_API_URL is not configured." },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const encodedPath = path
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const targetUrl = `${API_URL}/${encodedPath}${request.nextUrl.search}`;
  const requestHeaders = new Headers();

  for (const name of [
    "accept",
    "authorization",
    "content-type",
    "cookie",
    "origin",
  ]) {
    const value = request.headers.get(name);
    if (value) requestHeaders.set(name, value);
  }

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers: requestHeaders,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    console.error("Backend proxy request failed:", error);
    return NextResponse.json(
      { success: false, message: "Unable to reach the backend API." },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  for (const name of [
    "cache-control",
    "content-disposition",
    "content-type",
    "etag",
    "last-modified",
  ]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const setCookies =
    (upstream.headers as HeadersWithSetCookie).getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    responseHeaders.append("set-cookie", rewriteSessionCookie(cookie));
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
