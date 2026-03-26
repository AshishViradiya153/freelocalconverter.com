"use client";

import * as React from "react";
import { Braces, FileJson2, Globe, HelpCircle, Webhook } from "lucide-react";
import { toast } from "sonner";
import { JSONPath } from "jsonpath-plus";
import { parse as parseGraphql, print as printGraphql, buildClientSchema } from "graphql";
import YAML from "yaml";

import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type ToolId = "converter" | "http" | "openapi" | "graphql" | "webhook";

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

interface HttpRequestModel {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

type ConverterFormat = "curl" | "fetch" | "axios" | "python-requests";

function errorToMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name || "Unknown error";
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    const key = k.trim();
    if (!key) continue;
    out[key] = String(v ?? "").trim();
  }
  return out;
}

function parseHeaderLine(line: string): { key: string; value: string } | null {
  const idx = line.indexOf(":");
  if (idx <= 0) return null;
  const key = line.slice(0, idx).trim();
  const value = line.slice(idx + 1).trim();
  if (!key) return null;
  return { key, value };
}

function stripOuterQuotes(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

function jsStringLiteral(s: string): string {
  return JSON.stringify(s);
}

function pyStringLiteral(s: string): string {
  // Minimal escaping for readable snippets.
  if (!s.includes("'")) return `'${s}'`;
  return `"${s.replaceAll('"', '\\"')}"`;
}

function formatJsObjectLiteral(obj: Record<string, string>, indent = 2): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return "{}";
  const pad = " ".repeat(indent);
  const inner = entries
    .map(([k, v]) => `${pad}${jsStringLiteral(k)}: ${jsStringLiteral(v)}`)
    .join(",\n");
  return `{\n${inner}\n}`;
}

function parseCurl(command: string): HttpRequestModel {
  const raw = command.trim();
  if (!raw) throw new Error("Paste a cURL command first.");
  if (!raw.includes("curl")) throw new Error("That doesn't look like a cURL command.");

  const tokens =
    raw
      .replace(/\\\n/g, " ")
      .match(/"[^"]*"|'[^']*'|\S+/g) ?? [];

  let method: HttpMethod = "GET";
  let url: string | null = null;
  const headers: Record<string, string> = {};
  let body: string | null = null;

  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i]!;
    const next = tokens[i + 1];

    if (t === "curl") continue;

    if (t === "-X" || t === "--request") {
      const m = stripOuterQuotes(next ?? "");
      if (!m) continue;
      method = m.toUpperCase() as HttpMethod;
      i += 1;
      continue;
    }

    if (t === "-H" || t === "--header") {
      const hv = stripOuterQuotes(next ?? "");
      const parsed = parseHeaderLine(hv);
      if (parsed) headers[parsed.key] = parsed.value;
      i += 1;
      continue;
    }

    if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary") {
      const dv = stripOuterQuotes(next ?? "");
      body = body ? `${body}&${dv}` : dv;
      if (method === "GET") method = "POST";
      i += 1;
      continue;
    }

    if (t === "-u" || t === "--user") {
      const uv = stripOuterQuotes(next ?? "");
      if (uv) headers.Authorization = `Basic ${btoa(uv)}`;
      i += 1;
      continue;
    }

    if (!t.startsWith("-")) {
      const maybeUrl = stripOuterQuotes(t);
      if (/^https?:\/\//i.test(maybeUrl)) url = maybeUrl;
    }
  }

  if (!url) throw new Error("Couldn't find a URL in that cURL command.");

  return { method, url, headers: normalizeHeaders(headers), body };
}

function parseFetch(code: string): HttpRequestModel {
  const raw = code.trim();
  if (!raw) throw new Error("Paste a fetch() snippet first.");
  const urlMatch = raw.match(/fetch\(\s*(['"`])([^'"`]+)\1\s*,?/);
  if (!urlMatch) throw new Error("Couldn't find a URL in fetch(...).");
  const url = urlMatch[2]!;

  const methodMatch = raw.match(/method\s*:\s*(['"`])(\w+)\1/i);
  const method = (methodMatch?.[2]?.toUpperCase() ?? "GET") as HttpMethod;

  const headers: Record<string, string> = {};
  const headersMatch = raw.match(/headers\s*:\s*\{([\s\S]*?)\}/m);
  if (headersMatch) {
    const body = headersMatch[1] ?? "";
    const pairs = body.match(/(['"`])([^'"`]+)\1\s*:\s*(['"`])([^'"`]+)\3/g) ?? [];
    for (const p of pairs) {
      const m = p.match(/(['"`])([^'"`]+)\1\s*:\s*(['"`])([^'"`]+)\3/);
      if (m) headers[m[2]!] = m[4]!;
    }
  }

  let body: string | null = null;
  const bodyMatch = raw.match(/body\s*:\s*([\s\S]*?)(,|\}\s*\))/m);
  if (bodyMatch) body = bodyMatch[1]?.trim() ?? null;
  if (body && body.endsWith(",")) body = body.slice(0, -1).trim();

  return { method, url, headers: normalizeHeaders(headers), body };
}

function parseAxios(code: string): HttpRequestModel {
  const raw = code.trim();
  if (!raw) throw new Error("Paste an axios snippet first.");

  const configStyle = raw.match(/axios\(\s*\{([\s\S]*?)\}\s*\)/m);
  if (configStyle) {
    const cfg = configStyle[1] ?? "";
    const urlMatch = cfg.match(/url\s*:\s*(['"`])([^'"`]+)\1/);
    const methodMatch = cfg.match(/method\s*:\s*(['"`])(\w+)\1/i);
    const dataMatch = cfg.match(/\bdata\s*:\s*([\s\S]*?)(,|\n\s*\w+\s*:|\s*$)/m);
    const headersMatch = cfg.match(/headers\s*:\s*\{([\s\S]*?)\}/m);

    const url = urlMatch?.[2];
    if (!url) throw new Error("Couldn't find url: in axios({ ... }).");
    const method = (methodMatch?.[2]?.toUpperCase() ?? "GET") as HttpMethod;

    const headers: Record<string, string> = {};
    if (headersMatch) {
      const pairs =
        (headersMatch[1] ?? "").match(/(['"`])([^'"`]+)\1\s*:\s*(['"`])([^'"`]+)\3/g) ??
        [];
      for (const p of pairs) {
        const m = p.match(/(['"`])([^'"`]+)\1\s*:\s*(['"`])([^'"`]+)\3/);
        if (m) headers[m[2]!] = m[4]!;
      }
    }

    const body = dataMatch?.[1]?.trim() ?? null;
    return { method, url, headers: normalizeHeaders(headers), body };
  }

  const callStyle = raw.match(/axios\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]+)\2([\s\S]*?)\)/i);
  if (!callStyle) throw new Error("Unsupported axios snippet format.");
  const mName = callStyle[1]!.toUpperCase();
  const url = callStyle[3]!;
  const method = (mName === "DELETE" ? "DELETE" : (mName as HttpMethod)) as HttpMethod;
  return { method, url, headers: {}, body: null };
}

function parsePythonRequests(code: string): HttpRequestModel {
  const raw = code.trim();
  if (!raw) throw new Error("Paste a Python requests snippet first.");

  const call = raw.match(/requests\.(get|post|put|patch|delete)\(\s*(['"])([^'"]+)\2([\s\S]*?)\)/i);
  if (!call) throw new Error("Couldn't find requests.<method>(url, ...).");
  const method = call[1]!.toUpperCase() as HttpMethod;
  const url = call[3]!;

  const headers: Record<string, string> = {};
  const headersMatch = raw.match(/headers\s*=\s*\{([\s\S]*?)\}/m);
  if (headersMatch) {
    const pairs = (headersMatch[1] ?? "").match(/(['"])([^'"]+)\1\s*:\s*(['"])([^'"]*)\3/g) ?? [];
    for (const p of pairs) {
      const m = p.match(/(['"])([^'"]+)\1\s*:\s*(['"])([^'"]*)\3/);
      if (m) headers[m[2]!] = m[4] ?? "";
    }
  }

  const jsonMatch = raw.match(/\bjson\s*=\s*([\s\S]*?)(,|\)|\n)/m);
  const dataMatch = raw.match(/\bdata\s*=\s*([\s\S]*?)(,|\)|\n)/m);
  const body = (jsonMatch?.[1] ?? dataMatch?.[1] ?? "").trim() || null;

  return { method, url, headers: normalizeHeaders(headers), body };
}

function parseToModel(format: ConverterFormat, text: string): HttpRequestModel {
  if (format === "curl") return parseCurl(text);
  if (format === "fetch") return parseFetch(text);
  if (format === "axios") return parseAxios(text);
  return parsePythonRequests(text);
}

function renderCurl(m: HttpRequestModel): string {
  const lines: string[] = [];
  lines.push(`curl ${jsStringLiteral(m.url)} \\`);
  lines.push(`  -X ${m.method} \\`);
  for (const [k, v] of Object.entries(m.headers)) {
    lines.push(`  -H ${jsStringLiteral(`${k}: ${v}`)} \\`);
  }
  if (m.body) {
    lines.push(`  --data ${jsStringLiteral(m.body)} \\`);
  }
  return lines.join("\n").replace(/\\\s*$/, "");
}

function renderFetch(m: HttpRequestModel): string {
  const parts: string[] = [];
  parts.push(`await fetch(${jsStringLiteral(m.url)}, {`);
  parts.push(`  method: ${jsStringLiteral(m.method)},`);
  if (Object.keys(m.headers).length > 0) {
    parts.push(`  headers: ${formatJsObjectLiteral(m.headers, 4)},`);
  }
  if (m.body) {
    parts.push(`  body: ${m.body.startsWith("JSON.stringify") ? m.body : jsStringLiteral(m.body)},`);
  }
  parts.push(`});`);
  return parts.join("\n");
}

function renderAxios(m: HttpRequestModel): string {
  const parts: string[] = [];
  parts.push("await axios({");
  parts.push(`  method: ${jsStringLiteral(m.method.toLowerCase())},`);
  parts.push(`  url: ${jsStringLiteral(m.url)},`);
  if (Object.keys(m.headers).length > 0) {
    parts.push(`  headers: ${formatJsObjectLiteral(m.headers, 4)},`);
  }
  if (m.body) {
    parts.push(`  data: ${m.body.startsWith("{") || m.body.startsWith("[") ? m.body : jsStringLiteral(m.body)},`);
  }
  parts.push("});");
  return parts.join("\n");
}

function renderPythonRequests(m: HttpRequestModel): string {
  const lines: string[] = [];
  const method = m.method.toLowerCase();
  const args: string[] = [pyStringLiteral(m.url)];
  if (Object.keys(m.headers).length > 0) {
    const hdr = Object.entries(m.headers)
      .map(([k, v]) => `${pyStringLiteral(k)}: ${pyStringLiteral(v)}`)
      .join(", ");
    args.push(`headers={${hdr}}`);
  }
  if (m.body) {
    args.push(`data=${pyStringLiteral(m.body)}`);
  }
  lines.push(`import requests`);
  lines.push(`resp = requests.${method}(${args.join(", ")})`);
  lines.push("print(resp.status_code)");
  lines.push("print(resp.text)");
  return lines.join("\n");
}

function renderFromModel(format: ConverterFormat, model: HttpRequestModel): string {
  if (format === "curl") return renderCurl(model);
  if (format === "fetch") return renderFetch(model);
  if (format === "axios") return renderAxios(model);
  return renderPythonRequests(model);
}

function explainStatus(code: number): { title: string; meaning: string; tips: string[] } {
  const common: Record<number, { title: string; meaning: string; tips: string[] }> = {
    200: {
      title: "OK",
      meaning: "Request succeeded. Response contains the requested resource.",
      tips: ["If you expected a create, consider returning 201 for clarity."],
    },
    201: {
      title: "Created",
      meaning: "A new resource was created successfully.",
      tips: ["Include a Location header when applicable."],
    },
    204: {
      title: "No Content",
      meaning: "Request succeeded and there is no response body.",
      tips: ["Do not send a body; some clients will ignore it."],
    },
    301: {
      title: "Moved Permanently",
      meaning: "Resource has a new permanent URL.",
      tips: ["Clients may cache aggressively."],
    },
    302: {
      title: "Found",
      meaning: "Temporary redirect (commonly used but ambiguous).",
      tips: ["For explicit method semantics, consider 307/308."],
    },
    400: {
      title: "Bad Request",
      meaning: "Client error: invalid payload, parameters, or validation failure.",
      tips: ["Return a structured error body (code/message/fields)."],
    },
    401: {
      title: "Unauthorized",
      meaning: "Missing or invalid authentication credentials.",
      tips: ["Include WWW-Authenticate for auth schemes when appropriate."],
    },
    403: {
      title: "Forbidden",
      meaning: "Authenticated, but not allowed to access the resource.",
      tips: ["Avoid leaking authorization details in errors."],
    },
    404: {
      title: "Not Found",
      meaning: "Resource does not exist (or is intentionally hidden).",
      tips: ["For APIs, distinguish from 410 when a resource is gone."],
    },
    409: {
      title: "Conflict",
      meaning: "Request conflicts with current state (duplicate, version conflict).",
      tips: ["Great for idempotency-key replays or unique constraints."],
    },
    422: {
      title: "Unprocessable Content",
      meaning: "Semantically invalid: validation errors while well-formed.",
      tips: ["Common for JSON schema validation failures."],
    },
    429: {
      title: "Too Many Requests",
      meaning: "Rate limited.",
      tips: ["Use Retry-After and document rate limits."],
    },
    500: {
      title: "Internal Server Error",
      meaning: "Unexpected server failure.",
      tips: ["Log correlation IDs and return a generic message to clients."],
    },
    502: {
      title: "Bad Gateway",
      meaning: "Upstream dependency failed or returned invalid response.",
      tips: ["Check reverse proxy / gateway / serverless logs."],
    },
    503: {
      title: "Service Unavailable",
      meaning: "Temporarily unavailable (maintenance, overload).",
      tips: ["Prefer 503 + Retry-After for planned downtime."],
    },
  };

  return (
    common[code] ?? {
      title: "Status",
      meaning: "Not in the built-in quick list. Still valid if used correctly.",
      tips: ["If this is custom logic, document when clients should see it."],
    }
  );
}

function headerHelp(name: string): { summary: string; notes: string[] } | null {
  const key = name.trim().toLowerCase();
  const map: Record<string, { summary: string; notes: string[] }> = {
    "content-type": {
      summary: "Declares the media type of the body you are sending or receiving.",
      notes: ["Common: application/json, text/plain; charset=utf-8, multipart/form-data."],
    },
    accept: {
      summary: "What response types the client can handle.",
      notes: ["If omitted, servers often default to JSON for APIs."],
    },
    authorization: {
      summary: "Credentials (e.g., Bearer token, Basic auth).",
      notes: ["Never log or paste secrets into screenshots."],
    },
    "user-agent": {
      summary: "Identifies the client software.",
      notes: ["Some APIs use this for debugging or allowlisting."],
    },
    "cache-control": {
      summary: "Caching directives for requests/responses.",
      notes: ["Common: no-store, no-cache, max-age=..."],
    },
    etag: {
      summary: "Entity tag for conditional requests / caching.",
      notes: ["Use If-None-Match to get 304 responses."],
    },
    "if-none-match": {
      summary: "Revalidate using an ETag; server may return 304 Not Modified.",
      notes: ["Great for bandwidth savings."],
    },
    "x-request-id": {
      summary: "Correlation id for tracing a request across services.",
      notes: ["Echo it back in responses to aid debugging."],
    },
    "retry-after": {
      summary: "When the client should retry (seconds or HTTP date).",
      notes: ["Useful with 429 and 503."],
    },
    origin: {
      summary: "The request origin (scheme + host) used by browsers for CORS.",
      notes: ["Paired with Access-Control-Allow-Origin."],
    },
    "access-control-allow-origin": {
      summary: "CORS header controlling which origins may read the response.",
      notes: ["* is not allowed with credentials."],
    },
  };
  return map[key] ?? null;
}

function tryParseJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Paste JSON first.");
  return JSON.parse(trimmed);
}

function safeYamlOrJsonParse(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Paste YAML or JSON first.");
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);
  return YAML.parse(trimmed);
}

function CodePane({
  title,
  value,
  onChange,
  placeholder,
  readOnly,
  className,
}: {
  title: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium text-sm">{title}</div>
        {readOnly ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value);
                toast.success("Copied");
              } catch (error) {
                toast.error(errorToMessage(error));
              }
            }}
          >
            Copy
          </Button>
        ) : null}
      </div>
      <Textarea
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "min-h-56 resize-y font-mono text-xs leading-relaxed",
          readOnly ? "bg-muted/20" : "",
        )}
      />
    </div>
  );
}

interface ApiWebDevHelpersAppProps {
  initialTool?: ToolId;
  initialFromFormat?: ConverterFormat;
  initialToFormat?: ConverterFormat;
  showToolSwitcher?: boolean;
  title?: string;
  subtitle?: string;
}

export function ApiWebDevHelpersApp({
  initialTool = "converter",
  initialFromFormat = "curl",
  initialToFormat = "fetch",
  showToolSwitcher = true,
  title = "API & web dev helpers",
  subtitle = "Daily utilities for building and debugging HTTP APIs: request conversion, header/status explanations, OpenAPI browsing, GraphQL formatting, and webhook payload inspection.",
}: ApiWebDevHelpersAppProps) {
  const [tool, setTool] = React.useState<ToolId>(initialTool);

  const [fromFmt, setFromFmt] = React.useState<ConverterFormat>(initialFromFormat);
  const [toFmt, setToFmt] = React.useState<ConverterFormat>(initialToFormat);
  const [fromText, setFromText] = React.useState<string>("");

  const converterResult = React.useMemo(() => {
    try {
      const model = parseToModel(fromFmt, fromText);
      const out = renderFromModel(toFmt, model);
      return { ok: true as const, text: out, warning: null as string | null };
    } catch (error) {
      return { ok: false as const, text: "", warning: errorToMessage(error) };
    }
  }, [fromFmt, fromText, toFmt]);

  const [statusCode, setStatusCode] = React.useState<string>("200");
  const [headersRaw, setHeadersRaw] = React.useState<string>("");

  const httpExplainer = React.useMemo(() => {
    const code = Number(statusCode);
    const status =
      Number.isFinite(code) && code >= 100 && code <= 599 ? explainStatus(code) : null;
    const headerLines = headersRaw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const headers = headerLines
      .map(parseHeaderLine)
      .filter((v): v is { key: string; value: string } => Boolean(v));

    const explained = headers.map((h) => ({
      ...h,
      help: headerHelp(h.key),
    }));

    return { status, explained };
  }, [headersRaw, statusCode]);

  const [openapiText, setOpenapiText] = React.useState<string>("");
  const [openapiFileName, setOpenapiFileName] = React.useState<string | null>(null);
  const [openapiSelectedPath, setOpenapiSelectedPath] = React.useState<string | null>(null);
  const [openapiSelectedMethod, setOpenapiSelectedMethod] = React.useState<string | null>(null);

  const openapiParsed = React.useMemo(() => {
    if (!openapiText.trim()) {
      return { ok: false as const, error: null as string | null, doc: null as any };
    }
    try {
      const doc = safeYamlOrJsonParse(openapiText) as any;
      const version = doc?.openapi ?? doc?.swagger ?? null;
      const paths = doc?.paths && typeof doc.paths === "object" ? (doc.paths as Record<string, any>) : {};
      const servers = Array.isArray(doc?.servers) ? doc.servers : [];
      const components = doc?.components && typeof doc.components === "object" ? doc.components : {};
      return { ok: true as const, error: null as string | null, doc: { doc, version, paths, servers, components } };
    } catch (error) {
      return { ok: false as const, error: errorToMessage(error), doc: null as any };
    }
  }, [openapiText]);

  const openapiPathList = React.useMemo(() => {
    if (!openapiParsed.ok) return [];
    return Object.keys(openapiParsed.doc.paths).sort((a, b) => a.localeCompare(b));
  }, [openapiParsed.ok, openapiParsed.doc?.paths]);

  const openapiOp = React.useMemo(() => {
    if (!openapiParsed.ok) return null;
    if (!openapiSelectedPath) return null;
    const p = openapiParsed.doc.paths[openapiSelectedPath];
    if (!p || typeof p !== "object") return null;
    const method = openapiSelectedMethod ?? Object.keys(p).find((k) => typeof p[k] === "object") ?? null;
    if (!method) return null;
    const op = p[method];
    if (!op || typeof op !== "object") return null;
    return { path: openapiSelectedPath, method, op };
  }, [openapiParsed.ok, openapiParsed.doc?.paths, openapiSelectedMethod, openapiSelectedPath]);

  const [gqlQuery, setGqlQuery] = React.useState<string>("");
  const [gqlSchemaText, setGqlSchemaText] = React.useState<string>("");
  const [gqlSchemaFileName, setGqlSchemaFileName] = React.useState<string | null>(null);
  const [gqlTypeFilter, setGqlTypeFilter] = React.useState<string>("");
  const [gqlTypeSelected, setGqlTypeSelected] = React.useState<string | null>(null);

  const gqlSchema = React.useMemo(() => {
    if (!gqlSchemaText.trim()) return { ok: false as const, error: null as string | null, schema: null as any };
    try {
      const json = tryParseJson(gqlSchemaText) as any;
      const data = json?.data ?? json;
      const schema = buildClientSchema(data);
      return { ok: true as const, error: null as string | null, schema };
    } catch (error) {
      return { ok: false as const, error: errorToMessage(error), schema: null as any };
    }
  }, [gqlSchemaText]);

  const gqlTypes = React.useMemo(() => {
    if (!gqlSchema.ok) return [];
    const map = gqlSchema.schema.getTypeMap();
    const names = Object.keys(map)
      .filter((n) => !n.startsWith("__"))
      .sort((a, b) => a.localeCompare(b));
    const q = gqlTypeFilter.trim().toLowerCase();
    return q ? names.filter((n) => n.toLowerCase().includes(q)) : names;
  }, [gqlSchema.ok, gqlSchema.schema, gqlTypeFilter]);

  const gqlSelectedTypeInfo = React.useMemo(() => {
    if (!gqlSchema.ok) return null;
    if (!gqlTypeSelected) return null;
    const t = gqlSchema.schema.getType(gqlTypeSelected);
    if (!t) return null;
    // Keep this lightweight: rely on GraphQL's built-in .toString() for printable shape.
    return String(t);
  }, [gqlSchema.ok, gqlSchema.schema, gqlTypeSelected]);

  const [webhookText, setWebhookText] = React.useState<string>("");
  const [webhookJsonPath, setWebhookJsonPath] = React.useState<string>("");

  const webhookParsed = React.useMemo(() => {
    if (!webhookText.trim()) return { ok: false as const, error: null as string | null, json: null as any, pretty: "" };
    try {
      const json = tryParseJson(webhookText);
      const pretty = JSON.stringify(json, null, 2);
      return { ok: true as const, error: null as string | null, json, pretty };
    } catch (error) {
      return { ok: false as const, error: errorToMessage(error), json: null as any, pretty: "" };
    }
  }, [webhookText]);

  const webhookMatches = React.useMemo(() => {
    if (!webhookParsed.ok) return { ok: false as const, error: null as string | null, matches: [] as unknown[] };
    const expr = webhookJsonPath.trim();
    if (!expr) return { ok: true as const, error: null as string | null, matches: [] as unknown[] };
    try {
      const matches = JSONPath({
        path: expr,
        json: webhookParsed.json as object,
        wrap: true,
      }) as unknown[];
      return { ok: true as const, error: null as string | null, matches };
    } catch (error) {
      return { ok: false as const, error: errorToMessage(error), matches: [] as unknown[] };
    }
  }, [webhookJsonPath, webhookParsed.json, webhookParsed.ok]);

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-2">
        <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
        <p className="max-w-3xl text-muted-foreground text-sm leading-relaxed">
          {subtitle}
        </p>
      </header>

      {showToolSwitcher ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <ToggleGroup
              type="single"
              value={tool}
              onValueChange={(v) => {
                if (!v) return;
                setTool(v as ToolId);
              }}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="converter" aria-label="Converter">
                <Globe className="mr-2 size-4" aria-hidden="true" />
                Converter
              </ToggleGroupItem>
              <ToggleGroupItem value="http" aria-label="HTTP explainer">
                <HelpCircle className="mr-2 size-4" aria-hidden="true" />
                HTTP explain
              </ToggleGroupItem>
              <ToggleGroupItem value="openapi" aria-label="OpenAPI viewer">
                <FileJson2 className="mr-2 size-4" aria-hidden="true" />
                OpenAPI viewer
              </ToggleGroupItem>
              <ToggleGroupItem value="graphql" aria-label="GraphQL tools">
                <Braces className="mr-2 size-4" aria-hidden="true" />
                GraphQL
              </ToggleGroupItem>
              <ToggleGroupItem value="webhook" aria-label="Webhook viewer">
                <Webhook className="mr-2 size-4" aria-hidden="true" />
                Webhook viewer
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Separator />
        </>
      ) : null}

      {tool === "converter" ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid gap-1">
                <Label>From</Label>
                <ToggleGroup
                  type="single"
                  value={fromFmt}
                  onValueChange={(v) => v && setFromFmt(v as ConverterFormat)}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="curl">cURL</ToggleGroupItem>
                  <ToggleGroupItem value="fetch">fetch</ToggleGroupItem>
                  <ToggleGroupItem value="axios">axios</ToggleGroupItem>
                  <ToggleGroupItem value="python-requests">Python</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="grid gap-1">
                <Label>To</Label>
                <ToggleGroup
                  type="single"
                  value={toFmt}
                  onValueChange={(v) => v && setToFmt(v as ConverterFormat)}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="curl">cURL</ToggleGroupItem>
                  <ToggleGroupItem value="fetch">fetch</ToggleGroupItem>
                  <ToggleGroupItem value="axios">axios</ToggleGroupItem>
                  <ToggleGroupItem value="python-requests">Python</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setFromText("");
                  toast.success("Cleared");
                }}
              >
                Clear
              </Button>
            </div>
            <CodePane
              title="Input"
              value={fromText}
              onChange={setFromText}
              placeholder={
                fromFmt === "curl"
                  ? "Paste a curl command…"
                  : fromFmt === "fetch"
                    ? "Paste a fetch() snippet…"
                    : fromFmt === "axios"
                      ? "Paste an axios snippet…"
                      : "Paste a requests.<method>(...) snippet…"
              }
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-muted-foreground text-sm">
                {converterResult.ok ? "Parsed request and rendered output." : converterResult.warning}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!converterResult.ok) {
                    toast.error(converterResult.warning ?? "Fix input first.");
                    return;
                  }
                  setFromText(converterResult.text);
                  setFromFmt(toFmt);
                  toast.success("Swapped");
                }}
                disabled={!converterResult.ok}
              >
                Swap
              </Button>
            </div>
            <CodePane title="Output" value={converterResult.ok ? converterResult.text : ""} readOnly />
            <div className="rounded-lg border bg-muted/10 p-3 text-muted-foreground text-xs leading-relaxed">
              Conversions are best-effort for common snippet shapes (headers + method + body). If your
              snippet uses advanced features (multipart, cookie jars, interceptors), the output may
              need small manual tweaks.
            </div>
          </div>
        </section>
      ) : null}

      {tool === "http" ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="status">HTTP status code</Label>
              <Input
                id="status"
                inputMode="numeric"
                value={statusCode}
                onChange={(e) => setStatusCode(e.target.value)}
                placeholder="e.g. 200"
                className="max-w-48"
              />
            </div>
            <CodePane
              title="Headers (paste as raw lines: `Name: value`)"
              value={headersRaw}
              onChange={setHeadersRaw}
              placeholder={"content-type: application/json\ncache-control: no-store\nx-request-id: ..."}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border bg-muted/10 p-4">
              <div className="font-medium text-sm">Status meaning</div>
              {httpExplainer.status ? (
                <div className="mt-2">
                  <div className="font-semibold text-base">
                    {statusCode.trim()} {httpExplainer.status.title}
                  </div>
                  <div className="mt-1 text-muted-foreground text-sm leading-relaxed">
                    {httpExplainer.status.meaning}
                  </div>
                  <ul className="mt-3 list-disc pl-5 text-muted-foreground text-sm">
                    {httpExplainer.status.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-2 text-muted-foreground text-sm">
                  Enter a status code from 100–599.
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-muted/10 p-4">
              <div className="font-medium text-sm">Header explanations</div>
              {httpExplainer.explained.length === 0 ? (
                <div className="mt-2 text-muted-foreground text-sm">
                  Paste some headers to get quick explanations.
                </div>
              ) : (
                <div className="mt-3 grid gap-3">
                  {httpExplainer.explained.map((h) => (
                    <div key={`${h.key}:${h.value}`} className="rounded-lg border bg-background p-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="font-mono text-xs">{h.key}</div>
                        <div className="truncate font-mono text-xs text-muted-foreground">
                          {h.value}
                        </div>
                      </div>
                      <div className="mt-2 text-muted-foreground text-sm leading-relaxed">
                        {h.help?.summary ?? "No built-in notes for this header yet."}
                      </div>
                      {h.help?.notes?.length ? (
                        <ul className="mt-2 list-disc pl-5 text-muted-foreground text-sm">
                          {h.help.notes.map((n) => (
                            <li key={n}>{n}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {tool === "openapi" ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[440px_1fr]">
          <div className="flex flex-col gap-4">
            <FileDropZone
              disabled={false}
              busy={false}
              accept=".json,.yaml,.yml,application/json,text/yaml,application/x-yaml"
              multiple={false}
              onFiles={async (files) => {
                const f = files?.[0];
                if (!f) return;
                try {
                  const text = await f.text();
                  setOpenapiFileName(f.name);
                  setOpenapiText(text);
                  setOpenapiSelectedPath(null);
                  setOpenapiSelectedMethod(null);
                  toast.success("Loaded spec");
                } catch (error) {
                  toast.error(errorToMessage(error));
                }
              }}
              fileIcon={FileJson2}
              dropTitle="Drop openapi.yaml / openapi.json"
              dropHint="All parsing happens locally in your browser."
              fileName={openapiFileName}
              chooseLabel="Choose file"
              chooseLabelWhenFileSelected="Choose another"
              fullWidth
            />

            <CodePane
              title="Spec (YAML or JSON)"
              value={openapiText}
              onChange={(v) => {
                setOpenapiText(v);
                setOpenapiFileName(null);
              }}
              placeholder="Paste your OpenAPI spec here…"
            />
          </div>

          <div className="min-h-0 rounded-xl border bg-muted/5">
            {!openapiParsed.ok ? (
              <div className="p-5">
                <div className="font-medium text-sm">Browser</div>
                <div className="mt-2 text-muted-foreground text-sm">
                  {openapiParsed.error
                    ? `Parse error: ${openapiParsed.error}`
                    : "Load or paste an OpenAPI spec to browse endpoints."}
                </div>
              </div>
            ) : (
              <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[320px_1fr]">
                <div className="min-h-0 border-border border-b lg:border-b-0 lg:border-r">
                  <div className="p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="font-medium text-sm">Paths</div>
                      <div className="text-muted-foreground text-xs">
                        {openapiParsed.doc.version ? `v${openapiParsed.doc.version}` : "OpenAPI"}
                      </div>
                    </div>
                  </div>
                  <div className="max-h-[60vh] overflow-auto px-2 pb-4">
                    {openapiPathList.length === 0 ? (
                      <div className="px-2 text-muted-foreground text-sm">No `paths` found.</div>
                    ) : (
                      <div className="grid gap-1">
                        {openapiPathList.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={cn(
                              "w-full rounded-md px-3 py-2 text-left font-mono text-xs hover:bg-muted/40",
                              openapiSelectedPath === p ? "bg-muted/50" : "",
                            )}
                            onClick={() => {
                              setOpenapiSelectedPath(p);
                              setOpenapiSelectedMethod(null);
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-h-0 p-5">
                  {!openapiOp ? (
                    <div className="text-muted-foreground text-sm">
                      Select a path to view operations.
                    </div>
                  ) : (
                    <div className="min-h-0">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {openapiOp.method.toUpperCase()}
                          </div>
                          <div className="font-semibold text-lg">{openapiOp.path}</div>
                        </div>
                        <ToggleGroup
                          type="single"
                          value={openapiSelectedMethod ?? openapiOp.method}
                          onValueChange={(v) => v && setOpenapiSelectedMethod(v)}
                          variant="outline"
                          size="sm"
                        >
                          {Object.keys(openapiParsed.doc.paths[openapiOp.path] ?? {})
                            .filter((k) => typeof (openapiParsed.doc.paths[openapiOp.path] ?? {})[k] === "object")
                            .map((k) => (
                              <ToggleGroupItem key={k} value={k}>
                                {k.toUpperCase()}
                              </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                      </div>

                      <div className="mt-4 grid gap-4">
                        <div className="rounded-lg border bg-background p-4">
                          <div className="font-medium text-sm">
                            {openapiOp.op.summary ?? "Operation"}
                          </div>
                          {openapiOp.op.description ? (
                            <div className="mt-2 text-muted-foreground text-sm leading-relaxed">
                              {openapiOp.op.description}
                            </div>
                          ) : null}
                          {Array.isArray(openapiOp.op.tags) && openapiOp.op.tags.length ? (
                            <div className="mt-3 text-muted-foreground text-xs">
                              Tags: {openapiOp.op.tags.join(", ")}
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-lg border bg-background p-4">
                          <div className="font-medium text-sm">Request</div>
                          <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-md bg-muted/20 p-3 font-mono text-xs leading-relaxed">
                            {JSON.stringify(
                              {
                                parameters: openapiOp.op.parameters ?? [],
                                requestBody: openapiOp.op.requestBody ?? null,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </div>

                        <div className="rounded-lg border bg-background p-4">
                          <div className="font-medium text-sm">Responses</div>
                          <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-md bg-muted/20 p-3 font-mono text-xs leading-relaxed">
                            {JSON.stringify(openapiOp.op.responses ?? {}, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {tool === "graphql" ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  try {
                    const doc = parseGraphql(gqlQuery);
                    setGqlQuery(printGraphql(doc));
                    toast.success("Formatted");
                  } catch (error) {
                    toast.error(errorToMessage(error));
                  }
                }}
                disabled={!gqlQuery.trim()}
              >
                Format query
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setGqlQuery("");
                  toast.success("Cleared");
                }}
              >
                Clear
              </Button>
            </div>
            <CodePane
              title="Query"
              value={gqlQuery}
              onChange={setGqlQuery}
              placeholder={"query MyQuery {\n  viewer {\n    id\n  }\n}\n"}
              className="flex-1"
            />
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <FileDropZone
              disabled={false}
              busy={false}
              accept=".json,application/json"
              multiple={false}
              onFiles={async (files) => {
                const f = files?.[0];
                if (!f) return;
                try {
                  const text = await f.text();
                  setGqlSchemaFileName(f.name);
                  setGqlSchemaText(text);
                  setGqlTypeSelected(null);
                  toast.success("Loaded schema");
                } catch (error) {
                  toast.error(errorToMessage(error));
                }
              }}
              fileIcon={FileJson2}
              dropTitle="Drop GraphQL introspection JSON"
              dropHint="Paste or upload the result of an introspection query."
              fileName={gqlSchemaFileName}
              chooseLabel="Choose file"
              chooseLabelWhenFileSelected="Choose another"
              fullWidth
            />

            <div className="grid grid-cols-1 gap-4 rounded-xl border bg-muted/5 p-4 lg:grid-cols-[240px_1fr]">
              <div className="min-h-0">
                <div className="flex items-center justify-between gap-3">
                  <Label>Types</Label>
                  <Input
                    value={gqlTypeFilter}
                    onChange={(e) => setGqlTypeFilter(e.target.value)}
                    placeholder="Filter…"
                    className="h-8 w-36"
                  />
                </div>
                <div className="mt-3 max-h-[48vh] overflow-auto rounded-lg border bg-background">
                  {!gqlSchema.ok ? (
                    <div className="p-3 text-muted-foreground text-sm">
                      {gqlSchema.error
                        ? `Parse error: ${gqlSchema.error}`
                        : "Load a schema to browse types."}
                    </div>
                  ) : (
                    <div className="grid gap-1 p-2">
                      {gqlTypes.map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={cn(
                            "w-full rounded-md px-2 py-1 text-left font-mono text-xs hover:bg-muted/40",
                            gqlTypeSelected === n ? "bg-muted/50" : "",
                          )}
                          onClick={() => setGqlTypeSelected(n)}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-h-0">
                <div className="font-medium text-sm">Type details</div>
                <pre className="mt-2 max-h-[48vh] overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-3 font-mono text-xs leading-relaxed">
                  {gqlSelectedTypeInfo ?? "Select a type to inspect."}
                </pre>
              </div>
            </div>

            <CodePane
              title="Schema JSON (optional paste)"
              value={gqlSchemaText}
              onChange={(v) => {
                setGqlSchemaText(v);
                setGqlSchemaFileName(null);
              }}
              placeholder='Paste introspection JSON here (e.g. {"data": {...}})…'
            />
          </div>
        </section>
      ) : null}

      {tool === "webhook" ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!webhookParsed.ok) {
                    toast.error(webhookParsed.error ?? "Paste valid JSON first.");
                    return;
                  }
                  setWebhookText(webhookParsed.pretty);
                  toast.success("Prettified");
                }}
                disabled={!webhookText.trim()}
              >
                Pretty print
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setWebhookText("");
                  setWebhookJsonPath("");
                  toast.success("Cleared");
                }}
              >
                Clear
              </Button>
            </div>
            <CodePane
              title="Payload (JSON)"
              value={webhookText}
              onChange={setWebhookText}
              placeholder='Paste a webhook payload JSON here… (ex: {"id":"evt_...","type":"...","data":{...}})'
            />
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <div className="rounded-xl border bg-muted/10 p-4">
              <div className="font-medium text-sm">JSONPath search</div>
              <div className="mt-2 grid gap-2">
                <Input
                  value={webhookJsonPath}
                  onChange={(e) => setWebhookJsonPath(e.target.value)}
                  placeholder='e.g. $.data.object.id or $.items[*].sku'
                />
                <div className="text-muted-foreground text-xs">
                  Tip: JSONPath is case-sensitive. Use `[*]` for arrays.
                </div>
              </div>
              <div className="mt-3">
                {!webhookParsed.ok ? (
                  <div className="text-muted-foreground text-sm">
                    {webhookParsed.error ? `Parse error: ${webhookParsed.error}` : "Paste JSON to search."}
                  </div>
                ) : webhookMatches.ok ? (
                  <pre className="max-h-[45vh] overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-3 font-mono text-xs leading-relaxed">
                    {webhookJsonPath.trim()
                      ? JSON.stringify(webhookMatches.matches, null, 2)
                      : "Enter a JSONPath expression to see matches."}
                  </pre>
                ) : (
                  <div className="text-destructive text-sm">JSONPath error: {webhookMatches.error}</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-muted/10 p-4">
              <div className="font-medium text-sm">Pretty view</div>
              <pre className="mt-2 max-h-[45vh] overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-3 font-mono text-xs leading-relaxed">
                {webhookParsed.ok ? webhookParsed.pretty : "Paste JSON to render a pretty view."}
              </pre>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

