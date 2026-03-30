"use client";

import { ExternalLink, FileCode2, Loader2, Search } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { toolHeroTitleClassName } from "@/components/tool-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchHtmlInBrowser,
  mergePreviewDescription,
  mergePreviewImage,
  mergePreviewTitle,
  type OpenGraphParseResult,
  parseOpenGraphFromHtml,
} from "@/lib/open-graph/parse-html-meta";

export function OpenGraphPreviewApp() {
  const [pageUrl, setPageUrl] = React.useState("");
  const [htmlInput, setHtmlInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<OpenGraphParseResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const applyParsed = React.useCallback(
    (parsed: OpenGraphParseResult, toastOk: string) => {
      setData(parsed);
      setError(null);
      toast.success(toastOk);
    },
    [],
  );

  const onParsePasted = React.useCallback(() => {
    const base = pageUrl.trim() || null;
    const parsed = parseOpenGraphFromHtml(htmlInput, base);
    if (!parsed.ok) {
      setError(parsed.error);
      setData(null);
      toast.error(parsed.error);
      return;
    }
    applyParsed(parsed.data, "Parsed HTML in your browser.");
  }, [applyParsed, htmlInput, pageUrl]);

  const onFetchInBrowser = React.useCallback(async () => {
    const u = pageUrl.trim();
    if (!u) {
      toast.error("Enter a page URL to fetch.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const fetched = await fetchHtmlInBrowser(u);
      if (!fetched.ok) {
        setError(fetched.error);
        toast.error(fetched.error);
        return;
      }
      const parsed = parseOpenGraphFromHtml(fetched.html, fetched.finalUrl);
      if (!parsed.ok) {
        setError(parsed.error);
        toast.error(parsed.error);
        return;
      }
      const withUrl: OpenGraphParseResult = {
        ...parsed.data,
        finalUrl: fetched.finalUrl,
      };
      applyParsed(withUrl, "Fetched with CORS and parsed locally.");
    } finally {
      setLoading(false);
    }
  }, [applyParsed, pageUrl]);

  const previewTitle = data ? mergePreviewTitle(data) : null;
  const previewDesc = data ? mergePreviewDescription(data) : null;
  const previewImage = data ? mergePreviewImage(data) : null;

  return (
    <div className="container flex flex-col gap-6 py-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg border bg-muted/10">
            <Search className="size-5" aria-hidden />
          </div>
          <h1 className={toolHeroTitleClassName}>Open Graph preview</h1>
        </div>
        <p className="max-w-3xl text-muted-foreground text-sm">
          Parse <code className="rounded bg-muted px-1">og:*</code> and{" "}
          <code className="rounded bg-muted px-1">twitter:*</code> meta tags
          entirely in your browser with{" "}
          <code className="rounded bg-muted px-1">DOMParser</code>. Paste HTML
          from View Source (always works), or try a direct fetch when the site
          allows CORS. No server API and no third-party proxy.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border bg-background p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="og-page-url" className="text-sm">
            Page URL (for resolving relative images and optional fetch)
          </Label>
          <Input
            id="og-page-url"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="https://example.com/article"
            inputMode="url"
            disabled={loading}
          />
          <p className="text-muted-foreground text-xs">
            Required for the CORS fetch button. For pasted HTML only, it is
            still recommended so{" "}
            <code className="rounded bg-muted px-0.5">og:image</code> paths
            resolve correctly.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={loading || !pageUrl.trim()}
            onClick={() => void onFetchInBrowser()}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Search className="size-4" aria-hidden />
            )}
            Fetch in browser (CORS)
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-background p-4">
        <div className="flex items-center gap-2">
          <FileCode2 className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="font-semibold text-sm tracking-tight">Paste HTML</h2>
        </div>
        <p className="text-muted-foreground text-xs">
          Open the live page, use View Source (or Save as complete page and open
          the HTML), copy the markup, paste here, then Parse. This path never
          depends on cross-origin fetch.
        </p>
        <Textarea
          value={htmlInput}
          onChange={(e) => setHtmlInput(e.target.value)}
          placeholder="<html>…</html>"
          className="min-h-[200px] font-mono text-xs"
          disabled={loading}
          spellCheck={false}
        />
        <Button
          type="button"
          disabled={loading || !htmlInput.trim()}
          onClick={onParsePasted}
          className="w-fit gap-2"
        >
          <FileCode2 className="size-4" aria-hidden />
          Parse pasted HTML
        </Button>
      </section>

      {data ? (
        <>
          <section className="flex flex-col gap-3 rounded-xl border bg-background p-4">
            <h2 className="font-semibold text-sm tracking-tight">
              Card preview
            </h2>
            {data.finalUrl ? (
              <p className="text-muted-foreground text-xs">
                Page URL:{" "}
                <a
                  href={data.finalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {data.finalUrl}
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                No base URL set: relative image URLs are shown unresolved. Add
                Page URL and parse again to fix previews.
              </p>
            )}
            <div className="flex max-w-xl flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
              {previewImage ? (
                <div className="relative aspect-[1.91/1] w-full bg-muted">
                  {/* biome-ignore lint/performance/noImgElement: arbitrary remote og:image URL */}
                  <img
                    src={previewImage}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-muted text-muted-foreground text-sm">
                  No og:image / twitter:image
                </div>
              )}
              <div className="flex flex-col gap-1 p-3">
                <p className="font-semibold text-sm leading-snug">
                  {previewTitle ?? "(no title)"}
                </p>
                {previewDesc ? (
                  <p className="line-clamp-3 text-muted-foreground text-xs leading-snug">
                    {previewDesc}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-2 rounded-xl border bg-background p-4 font-mono text-xs">
            <h2 className="font-sans font-semibold text-sm tracking-tight">
              Raw fields
            </h2>
            <Separator />
            <dl className="grid gap-2">
              {(
                [
                  ["title", data.title],
                  ["og:title", data.ogTitle],
                  ["og:description", data.ogDescription],
                  ["og:site_name", data.ogSiteName],
                  ["og:image (first)", data.ogImage],
                  [
                    "og:image (all)",
                    data.ogImages.length ? data.ogImages.join("\n") : null,
                  ],
                  ["og:url", data.ogUrl],
                  ["twitter:card", data.twitterCard],
                  ["twitter:title", data.twitterTitle],
                  ["twitter:description", data.twitterDescription],
                  ["twitter:image (first)", data.twitterImage],
                  [
                    "twitter:image (all)",
                    data.twitterImages.length
                      ? data.twitterImages.join("\n")
                      : null,
                  ],
                ] as const
              ).map(([k, v]) => (
                <div
                  key={k}
                  className="flex flex-col gap-0.5 sm:flex-row sm:gap-3"
                >
                  <dt className="shrink-0 text-muted-foreground">{k}</dt>
                  <dd className="wrap-break-word min-w-0 whitespace-pre-wrap text-foreground">
                    {v ?? "-"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      ) : null}

      {error && !data ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
