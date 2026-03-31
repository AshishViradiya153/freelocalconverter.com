import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "create-zip-in-browser",
  title: "How to create a ZIP file in your browser (no uploads)",
  description:
    "A simple workflow to build a ZIP locally in your browser: select files, name the archive, and download. Great for bundling attachments without installing tools.",
  publishedAt: "2026-03-31",
  category: "guide",
  readTimeMinutes: 7,
  keywords: [
    "create zip file in browser",
    "zip files online",
    "make a zip",
    "zip without upload",
    "archive converter",
  ],
};

const linkClass =
  "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        If you need to bundle a handful of files into one download, a ZIP archive is
        still the most universal format. The trick is doing it quickly without
        installing software or uploading sensitive files.
      </p>

      <p>
        Use our{" "}
        <Link href="/archive-converter" className={linkClass}>
          Archive Converter
        </Link>{" "}
        to create a ZIP locally in your browser.
      </p>

      <h2>Step-by-step: create a ZIP</h2>
      <ol>
        <li>Select the files you want to bundle.</li>
        <li>Pick a ZIP filename (for example, <code className="text-foreground">attachments.zip</code>).</li>
        <li>Download the ZIP.</li>
      </ol>

      <h2>What “local in your browser” means</h2>
      <p>
        The archive is assembled on your device. That’s useful when you’re dealing
        with private exports, internal documents, or client attachments and you
        don’t want to upload them to a third-party server just to zip them.
      </p>

      <h2>Tips</h2>
      <ul>
        <li>
          If you select files with the same name, the tool will keep both by
          de-duping names inside the ZIP.
        </li>
        <li>
          For very large files, ZIP creation time depends on your device CPU and
          memory.
        </li>
      </ul>
    </BlogProse>
  );
}

