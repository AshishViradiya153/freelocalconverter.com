"use client";

import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Copy, Info, KeyRound, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import * as React from "react";
import { toast } from "sonner";
import {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolPaneTitle,
  ToolSectionHeading,
  ToolToolbar,
} from "@/components/tool-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { decodeJwt, type JwtDecodeResult } from "@/lib/text/jwt-decode";
import { cn } from "@/lib/utils";

const monoBlockClass =
  "max-h-[min(22rem,40vh)] min-h-[10rem] overflow-auto rounded-lg border border-border/80 bg-muted/15 p-3 font-mono text-xs leading-relaxed wrap-break-word";

function alertStyles(level: "critical" | "warning" | "info"): string {
  switch (level) {
    case "critical":
      return "border-destructive/50 bg-destructive/10 text-foreground";
    case "warning":
      return "border-amber-500/40 bg-amber-500/5 text-foreground dark:border-amber-400/35 dark:bg-amber-400/10";
    default:
      return "border-border bg-muted/30 text-foreground";
  }
}

function decodeResult(input: string): JwtDecodeResult {
  return decodeJwt(input);
}

export function JwtDecoderApp() {
  const locale = useLocale();
  const [input, setInput] = React.useState("");

  const parsed = React.useMemo(() => decodeResult(input), [input]);

  const dateFmt = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "en" ? undefined : locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );

  const onCopy = React.useCallback((label: string, text: string) => {
    void navigator.clipboard.writeText(text).then(
      () => toast.success(`Copied ${label}`),
      () => toast.error("Could not copy"),
    );
  }, []);

  const onClear = React.useCallback(() => {
    setInput("");
    toast.message("Cleared");
  }, []);

  return (
    <ToolPage>
      <ToolHero
        icon={<KeyRound className="size-8 md:size-9" aria-hidden />}
        title="JWT decoder"
        description="Inspect header and payload from a JSON Web Token (JWS). Decoding runs locally in your browser. Signatures are never verified here - use your auth library with the correct secret or JWKS on the server."
      />

      <ToolCard>
        <ToolToolbar className="items-start justify-between gap-3">
          <p className="max-w-xl text-muted-foreground text-xs leading-relaxed">
            Paste a Bearer token or raw JWT. We only Base64URL-decode segments;
            we do not call the network or store your token.
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onCopy("JWT", input)}
              disabled={!input.trim()}
            >
              <Copy className="size-4" aria-hidden />
              Copy JWT
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={!input.trim()}
            >
              <Trash2 className="size-4" aria-hidden />
              Clear
            </Button>
          </div>
        </ToolToolbar>

        <Label htmlFor="jwt-input" className="sr-only">
          JWT input
        </Label>
        <Textarea
          id="jwt-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          className="mt-3 min-h-24 resize-y font-mono text-xs leading-relaxed md:min-h-28"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
        />

        <Separator className="my-5" />

        {!input.trim() ? (
          <p className="text-muted-foreground text-sm">
            Enter a JWT to see the decoded header, payload, and signature
            material.
          </p>
        ) : null}

        {input.trim() && !parsed.ok ? (
          <p className="wrap-break-word text-destructive text-sm" role="alert">
            {parsed.error}
          </p>
        ) : null}

        {parsed.ok ? (
          <div className="flex flex-col gap-5">
            <div
              className="flex flex-col gap-2"
              role="region"
              aria-label="Security notices"
            >
              {parsed.alerts.map((a) => (
                <div
                  key={`${a.code}-${a.level}`}
                  className={cn(
                    "flex gap-3 rounded-xl border p-3 md:p-4",
                    alertStyles(a.level),
                  )}
                  role={a.level === "critical" ? "alert" : "status"}
                >
                  {a.level === "critical" ? (
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-destructive"
                      aria-hidden
                    />
                  ) : (
                    <Info
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  <p className="text-xs leading-relaxed md:text-sm">
                    {a.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {parsed.headerAlg ? (
                <Badge variant="secondary">alg: {parsed.headerAlg}</Badge>
              ) : null}
              {parsed.headerTyp ? (
                <Badge variant="outline">typ: {parsed.headerTyp}</Badge>
              ) : null}
              {parsed.headerKid ? (
                <Badge variant="outline">kid: {parsed.headerKid}</Badge>
              ) : null}
              <Badge variant="outline" className="font-mono">
                signature: {parsed.signatureByteLength} bytes
              </Badge>
            </div>

            {(parsed.exp ?? parsed.iat ?? parsed.nbf) ? (
              <section
                className="rounded-xl border border-border/70 bg-card/50 p-4"
                aria-labelledby="jwt-times-heading"
              >
                <ToolSectionHeading id="jwt-times-heading">
                  Standard time claims
                </ToolSectionHeading>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {parsed.exp ? (
                    <div className="rounded-lg bg-muted/20 p-3">
                      <dt className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                        exp
                      </dt>
                      <dd className="mt-1 font-mono text-xs">
                        {parsed.exp.seconds}
                      </dd>
                      <dd className="mt-1 text-muted-foreground text-xs">
                        {dateFmt.format(parsed.exp.seconds * 1000)} (
                        {formatDistanceToNow(parsed.exp.seconds * 1000, {
                          addSuffix: true,
                        })}
                        )
                      </dd>
                      {parsed.exp.expired ? (
                        <dd className="mt-1 font-medium text-amber-700 text-xs dark:text-amber-400">
                          Expired (clock check only)
                        </dd>
                      ) : null}
                    </div>
                  ) : null}
                  {parsed.iat ? (
                    <div className="rounded-lg bg-muted/20 p-3">
                      <dt className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                        iat
                      </dt>
                      <dd className="mt-1 font-mono text-xs">
                        {parsed.iat.seconds}
                      </dd>
                      <dd className="mt-1 text-muted-foreground text-xs">
                        {dateFmt.format(parsed.iat.seconds * 1000)}
                      </dd>
                    </div>
                  ) : null}
                  {parsed.nbf ? (
                    <div className="rounded-lg bg-muted/20 p-3">
                      <dt className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                        nbf
                      </dt>
                      <dd className="mt-1 font-mono text-xs">
                        {parsed.nbf.seconds}
                      </dd>
                      <dd className="mt-1 text-muted-foreground text-xs">
                        {dateFmt.format(parsed.nbf.seconds * 1000)}
                      </dd>
                      {parsed.nbf.notYetValid ? (
                        <dd className="mt-1 font-medium text-amber-700 text-xs dark:text-amber-400">
                          Not valid yet (clock check only)
                        </dd>
                      ) : null}
                    </div>
                  ) : null}
                </dl>
              </section>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <ToolPane>
                <div className="flex items-center justify-between gap-2">
                  <ToolPaneTitle>Header</ToolPaneTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => onCopy("header", parsed.headerPretty)}
                  >
                    <Copy className="size-4" aria-hidden />
                    Copy
                  </Button>
                </div>
                <pre className={monoBlockClass}>{parsed.headerPretty}</pre>
              </ToolPane>
              <ToolPane>
                <div className="flex items-center justify-between gap-2">
                  <ToolPaneTitle>Payload</ToolPaneTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => onCopy("payload", parsed.payloadPretty)}
                  >
                    <Copy className="size-4" aria-hidden />
                    Copy
                  </Button>
                </div>
                <pre className={monoBlockClass}>{parsed.payloadPretty}</pre>
              </ToolPane>
            </div>

            <ToolPane>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <ToolPaneTitle>Signature (Base64URL)</ToolPaneTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 self-start sm:self-auto"
                  onClick={() => onCopy("signature", parsed.signatureB64url)}
                >
                  <Copy className="size-4" aria-hidden />
                  Copy
                </Button>
              </div>
              <pre className={cn(monoBlockClass, "max-h-32 min-h-[4rem]")}>
                {parsed.signatureB64url || "(empty)"}
              </pre>
              <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
                Verification recomputes a MAC or asymmetric signature over
                <span className="font-mono">
                  {" "}
                  {
                    "ASCII(BASE64URL(UTF8(header))) + '.' + ASCII(BASE64URL(UTF8(payload)))"
                  }{" "}
                </span>
                using the algorithm in <span className="font-mono">alg</span>{" "}
                and your key material. This page does not perform that step, copy
                the token to your server or use your IdP’s JWKS flow.
              </p>
            </ToolPane>
          </div>
        ) : null}

        <p className="mt-4 text-muted-foreground text-xs">
          Everything runs locally. Nothing is uploaded.
        </p>
      </ToolCard>
    </ToolPage>
  );
}
