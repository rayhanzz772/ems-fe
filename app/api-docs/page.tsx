"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  Code2,
  LoaderCircle,
  Search,
  Send,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from "@/components/ui";
import { showError, showSuccess } from "@/lib/toast";

type Schema = {
  type?: string;
  format?: string;
  description?: string;
  enum?: string[];
  required?: string[];
  properties?: Record<string, Schema>;
  items?: Schema;
  $ref?: string;
  example?: unknown;
  default?: unknown;
};
type Parameter = {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: Schema;
};
type Operation = {
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: { content?: Record<string, { schema?: Schema }> };
  responses?: Record<string, { description?: string }>;
  security?: Record<string, string[]>[];
};
type Document = {
  openapi?: string;
  info?: { title?: string; version?: string; description?: string };
  servers?: { url: string }[];
  paths?: Record<string, Record<string, Operation>>;
  components?: { schemas?: Record<string, Schema> };
};
type OperationEntry = { path: string; method: string; operation: Operation };

const methods = ["get", "post", "put", "patch", "delete", "head", "options"];
const methodColors: Record<string, string> = {
  get: "bg-blue-500/10 text-blue-600",
  post: "bg-emerald-500/10 text-emerald-600",
  put: "bg-amber-500/10 text-amber-600",
  patch: "bg-violet-500/10 text-violet-600",
  delete: "bg-destructive/10 text-destructive",
  head: "bg-muted text-muted-foreground",
  options: "bg-muted text-muted-foreground",
};

function resolveSchema(schema: Schema | undefined, doc: Document) {
  if (!schema?.$ref) return schema;
  return (
    doc.components?.schemas?.[schema.$ref.split("/").pop() ?? ""] ?? schema
  );
}

function schemaLabel(schema?: Schema): string {
  if (!schema) return "—";
  if (schema.$ref) return schema.$ref.split("/").pop() ?? "schema";
  if (schema.type === "array") return `array of ${schemaLabel(schema.items)}`;
  return [schema.type, schema.format].filter(Boolean).join(" / ") || "object";
}

function defaultValue(
  schema: Schema | undefined,
  doc: Document,
  propertyName?: string,
): unknown {
  const value = resolveSchema(schema, doc);
  if (!value) return {};
  if (value.example !== undefined) return value.example;
  if (value.default !== undefined) return value.default;
  if (value.properties) {
    return Object.fromEntries(
      Object.entries(value.properties).map(([key, property]) => [
        key,
        defaultValue(property, doc, key),
      ]),
    );
  }
  if (value.type === "array") return [];
  if (value.type === "boolean") return false;
  if (value.type === "integer" || value.type === "number") return 0;
  if (propertyName === "email") return "admin@company.com";
  if (propertyName === "password") return "admin123";
  if (propertyName === "phone_number") return "+628123456789";
  if (propertyName === "first_name") return "John";
  if (propertyName === "last_name") return "Doe";
  return "";
}

function initialRequestBody(
  path: string,
  schema: Schema | undefined,
  doc: Document,
) {
  const generated = defaultValue(schema, doc);
  if (
    path.toLowerCase().includes("/login") &&
    (!generated ||
      typeof generated !== "object" ||
      Object.keys(generated).length === 0)
  ) {
    return { email: "admin@company.com", password: "admin123" };
  }
  return generated;
}

function SchemaView({ schema, doc }: { schema?: Schema; doc: Document }) {
  const value = resolveSchema(schema, doc);
  if (!value) return <span className="text-muted-foreground">No schema</span>;
  if (!value.properties) {
    return (
      <code className="rounded bg-muted px-2 py-1 text-sm">
        {schemaLabel(value)}
      </code>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border">
      {Object.entries(value.properties).map(([name, property]) => (
        <div
          key={name}
          className="grid gap-2 border-b p-3 last:border-0 sm:grid-cols-[150px_1fr]"
        >
          <code>
            {name}
            {value.required?.includes(name) && (
              <span className="ml-1 text-destructive">*</span>
            )}
          </code>
          <div className="text-sm">
            <p className="text-muted-foreground">{schemaLabel(property)}</p>
            {property.description && <p>{property.description}</p>}
            {property.enum && (
              <p className="text-xs text-muted-foreground">
                Allowed: {property.enum.join(", ")}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RequestTester({
  path,
  method,
  operation,
  doc,
}: OperationEntry & { doc: Document }) {
  const parameters = operation.parameters ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [authorization, setAuthorization] = useState(() => {
    if (typeof window === "undefined") return "";
    const token = window.localStorage.getItem("access_token");
    return token ? "Bearer " + token : "";
  });
  const [headers, setHeaders] = useState("{}");
  const [body, setBody] = useState(() => {
    const schema = operation.requestBody?.content?.["application/json"]?.schema;
    return operation.requestBody
      ? JSON.stringify(initialRequestBody(path, schema, doc), null, 2)
      : "";
  });
  const [sending, setSending] = useState(false);
  const [requestPreview, setRequestPreview] = useState("");
  const [responsePreview, setResponsePreview] = useState("");
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [requestError, setRequestError] = useState("");

  async function sendRequest() {
    setSending(true);
    setRequestError("");
    setResponsePreview("");
    try {
      const customHeaders = JSON.parse(headers) as Record<string, string>;
      const requestHeaders = new Headers(customHeaders);
      if (authorization.trim())
        requestHeaders.set("Authorization", authorization.trim());
      if (body.trim()) requestHeaders.set("Content-Type", "application/json");

      let requestPath = path;
      const query = new URLSearchParams();
      parameters.forEach((parameter) => {
        const value = values[`${parameter.in}:${parameter.name}`]?.trim();
        if (!value) return;
        if (parameter.in === "path")
          requestPath = requestPath.replace(
            `{${parameter.name}}`,
            encodeURIComponent(value),
          );
        if (parameter.in === "query") query.set(parameter.name, value);
        if (parameter.in === "header")
          requestHeaders.set(parameter.name, value);
      });
      if (query.size) requestPath += `?${query.toString()}`;

      const url = `${doc.servers?.[0]?.url ?? window.location.origin}${requestPath}`;
      const requestBody = body.trim() ? JSON.parse(body) : undefined;
      setRequestPreview(
        `${method.toUpperCase()} ${url}\n${JSON.stringify(Object.fromEntries(requestHeaders.entries()), null, 2)}${requestBody === undefined ? "" : `\n\n${JSON.stringify(requestBody, null, 2)}`}`,
      );
      const started = performance.now();
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: requestHeaders,
        credentials: "include",
        body:
          requestBody === undefined ? undefined : JSON.stringify(requestBody),
      });
      const raw = await response.text();
      let formatted = raw;
      try {
        formatted = JSON.stringify(JSON.parse(raw), null, 2);
      } catch {
        /* response is not JSON */
      }
      setResponseStatus(response.status);
      setResponsePreview(
        `${response.status} ${response.statusText} · ${Math.round(performance.now() - started)} ms\n\n${formatted}`,
      );
      if (response.ok) {
        showSuccess(
          "Request completed",
          `${response.status} ${response.statusText}`,
        );
      } else {
        showError(
          "Request failed",
          `${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : "Unable to send request.",
      );
      showError(
        "Request failed",
        error instanceof Error ? error.message : "Unable to send request.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5 border-t bg-muted/10 p-4">
      {operation.description && (
        <p className="text-sm">{operation.description}</p>
      )}
      {operation.security && (
        <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700">
          Authentication required
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="font-semibold">Request headers</h3>
          <Input
            type="text"
            value={authorization}
            onChange={(event) => setAuthorization(event.target.value)}
            placeholder="Authorization: Bearer token"
            aria-label="Authorization header"
          />
          <Textarea
            value={headers}
            onChange={(event) => setHeaders(event.target.value)}
            rows={3}
            placeholder='Custom headers JSON: {"X-Request-ID":"demo"}'
            aria-label="Custom headers JSON"
          />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Parameters</h3>
          {parameters.length === 0 && (
            <p className="text-sm text-muted-foreground">No parameters.</p>
          )}
          {parameters.map((parameter) => {
            const key = `${parameter.in}:${parameter.name}`;
            return (
              <div key={key}>
                <label className="mb-1 block text-xs text-muted-foreground">
                  {parameter.name} ({parameter.in})
                  {parameter.required && (
                    <span className="text-destructive"> *</span>
                  )}
                </label>
                <Input
                  value={values[key] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder={
                    parameter.description ?? schemaLabel(parameter.schema)
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
      {operation.requestBody && (
        <div className="space-y-2">
          <h3 className="font-semibold">Request body (JSON)</h3>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={8}
            className="font-mono text-xs"
            aria-label="Request body JSON"
          />
        </div>
      )}
      {operation.requestBody && (
        <SchemaView
          schema={operation.requestBody.content?.["application/json"]?.schema}
          doc={doc}
        />
      )}
      <button
        type="button"
        onClick={() => void sendRequest()}
        disabled={sending}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        <Send className="size-4" />
        {sending ? "Sending..." : "Send request"}
      </button>
      {requestError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {requestError}
        </p>
      )}
      {requestPreview && (
        <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
          <strong>HTTP Request</strong>
          {"\n\n"}
          {requestPreview}
        </pre>
      )}
      {responsePreview && (
        <pre
          className={`max-h-96 overflow-auto rounded-lg p-4 text-xs ${responseStatus && responseStatus >= 400 ? "bg-destructive/10 text-destructive" : "bg-slate-950 text-slate-100"}`}
        >
          <strong>Response JSON</strong>
          {"\n\n"}
          {responsePreview}
        </pre>
      )}
    </div>
  );
}

export default function ApiDocsPage() {
  const [doc, setDoc] = useState<Document | null>(null);
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      process.env.NEXT_PUBLIC_API_DOCS_URL ??
        "http://localhost:8000/api-docs/openapi.json",
      { credentials: "include", signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            `Unable to load API documentation (${response.status}).`,
          );
        return (await response.json()) as Document;
      })
      .then(setDoc)
      .catch((value: unknown) => {
        if (value instanceof DOMException && value.name === "AbortError")
          return;
        setError(
          value instanceof Error
            ? value.message
            : "Unable to load API documentation.",
        );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const operations = useMemo<OperationEntry[]>(() => {
    if (!doc?.paths) return [];
    const text = query.trim().toLowerCase();
    return Object.entries(doc.paths).flatMap(([path, pathItem]) =>
      Object.entries(pathItem)
        .filter(([method]) => methods.includes(method))
        .map(([method, operation]) => ({ path, method, operation }))
        .filter(
          ({ path, method, operation }) =>
            (methodFilter === "all" || method === methodFilter) &&
            (!text ||
              [path, method, operation.summary ?? "", ...(operation.tags ?? [])]
                .join(" ")
                .toLowerCase()
                .includes(text)),
        ),
    );
  }, [doc, methodFilter, query]);
  const groups = useMemo(
    () =>
      operations.reduce<Record<string, OperationEntry[]>>((value, item) => {
        const tag = item.operation.tags?.[0] ?? "Other";
        value[tag] ??= [];
        value[tag].push(item);
        return value;
      }, {}),
    [operations],
  );

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 p-5 md:p-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">
          {doc?.info?.title ?? "API Documentation"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {doc?.info?.description ?? "Explore the available API endpoints."}
        </p>
      </section>
      {loading && (
        <Card>
          <CardContent className="flex items-center gap-3 py-10 text-muted-foreground">
            <LoaderCircle className="animate-spin" /> Loading OpenAPI
            specification...
          </CardContent>
        </Card>
      )}
      {!loading && error && (
        <Card>
          <CardContent className="flex items-start gap-3 py-6 text-destructive">
            <AlertCircle />
            <div>
              <p className="font-medium">Could not load API documentation</p>
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
      {doc && (
        <Card>
          <CardHeader className="gap-4 border-b">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search paths, tags, or summaries..."
                  className="pl-9"
                />
              </div>
              <select
                aria-label="Filter by HTTP method"
                value={methodFilter}
                onChange={(event) => setMethodFilter(event.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                <option value="all">All methods</option>
                {methods.map((method) => (
                  <option key={method} value={method}>
                    {method.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {Object.entries(groups).map(([tag, items]) => (
              <section key={tag} className="space-y-2">
                <h2 className="px-1 text-sm font-semibold">{tag}</h2>
                {items.map((entry) => {
                  const key = `${entry.method}:${entry.path}`;
                  const open = expanded === key;
                  return (
                    <div
                      key={key}
                      className="overflow-hidden rounded-lg border"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/40"
                        onClick={() => setExpanded(open ? null : key)}
                      >
                        <span
                          className={`w-20 rounded px-2 py-1 text-center text-xs font-bold uppercase ${methodColors[entry.method]}`}
                        >
                          {entry.method}
                        </span>
                        <code className="min-w-0 flex-1 truncate text-sm font-medium">
                          {entry.path}
                        </code>
                        <span className="hidden text-sm text-muted-foreground md:block">
                          {entry.operation.summary ?? "No summary"}
                        </span>
                        <ChevronDown
                          className={`size-4 ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && <RequestTester {...entry} doc={doc} />}
                    </div>
                  );
                })}
              </section>
            ))}
            {!operations.length && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No endpoints match your filters.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
