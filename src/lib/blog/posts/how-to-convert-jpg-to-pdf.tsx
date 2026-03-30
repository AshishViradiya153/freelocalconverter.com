import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "how-to-convert-jpg-to-pdf",
  title: "How to convert JPG to PDF: one file, many photos, correct order",
  description:
    "Turn JPEG and other images into a single PDF: order pages, pick page size and fit, use Print to PDF or Acrobat, or build locally in the browser with Localtool’s Images to PDF.",
  publishedAt: "2026-04-02",
  category: "guide",
  readTimeMinutes: 9,
  keywords: [
    "how to convert jpg to pdf",
    "jpeg to pdf",
    "combine images into pdf",
    "merge jpg to one pdf",
    "images to pdf online",
  ],
};

export function BlogPostContent() {
  const linkClass =
    "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

  return (
    <BlogProse>
      <p>
        <strong>How to convert JPG to PDF</strong> most often means placing each
        raster image on its own <strong>PDF page</strong> (or tiling several on
        one sheet) and saving a single <code className="text-foreground">
          .pdf
        </code>{" "}
        file. Unlike JPEG, PDF is a <strong>container</strong>: it can embed
        compressed images without re-encoding them as harshly, which helps
        when you combine photos for email, e-signing, print shops, or archival.
        This article is for anyone merging phone screenshots, scans, or exports
        from design tools into one ordered document.
      </p>

      <p>
        <strong>Key takeaways</strong>
      </p>
      <ul>
        <li>
          <strong>Page order matters</strong>—confirm thumbnails before export,
          especially for contracts and storyboards.
        </li>
        <li>
          Choose <strong>page size</strong> (for example A4 or Letter) when the
          PDF must match a print template; use <strong>auto</strong> when each
          image should define its own page dimensions.
        </li>
        <li>
          <strong>Fit modes</strong> (<em>contain</em> vs <em>cover</em>) control
          cropping and margins around non-matching aspect ratios.
        </li>
        <li>
          To extract pages back to images, see{" "}
          <Link
            href="/blog/how-to-convert-pdf-to-jpg"
            className={linkClass}
          >
            how to convert PDF to JPG
          </Link>
          .
        </li>
      </ul>

      <h2>Why people merge JPEGs into PDF</h2>
      <p>
        Portals often accept <strong>one upload</strong> for identity packets,
        invoices, or homework. PDF keeps the bundle in sequence, preserves
        aspect ratio per page, and opens consistently on Windows, macOS, iOS,
        and Android. Adobe outlines broader “create PDF from documents” flows in{" "}
        <a
          href="https://helpx.adobe.com/acrobat/using/creating-simple-pdfs-acrobat.html"
          className={linkClass}
          rel="noopener noreferrer"
          target="_blank"
        >
          Create PDFs with Acrobat
        </a>
        , including assembling files and images into a new PDF.
      </p>

      <h2>Method 1: Print to PDF (Windows and Mac)</h2>
      <p>
        Open images in an app that supports printing (Photos, Preview, Edge),
        select <strong>Print</strong>, choose <strong>Microsoft Print to PDF</strong>{" "}
        (Windows) or <strong>Save as PDF</strong> (macOS), and verify orientation
        and margins. This is fast for a handful of files but ordering can be
        clumsy if the app sorts alphabetically in an unexpected way.
      </p>

      <h2>Method 2: iPhone and iPad</h2>
      <p>
        In <strong>Photos</strong>, select images, use the share sheet, and pick{" "}
        <strong>Save as PDF</strong> or <strong>Print</strong> → pinch to
        preview → share PDF—wording varies slightly by iOS version. Confirm the
        sequence before sharing to email or Messages.
      </p>

      <h2>Method 3: Adobe Acrobat</h2>
      <p>
        Use <strong>Combine files</strong> or <strong>Create PDF</strong> from
        multiple images, drag to reorder thumbnails, then save. Acrobat shines
        when you already pay for Pro features such as OCR on scans or redaction
        downstream.
      </p>

      <h2>Method 4: Local browser — Images to PDF</h2>
      <p>
        Localtool&apos;s{" "}
        <Link href="/images-to-pdf" className={linkClass}>
          Images to PDF
        </Link>{" "}
        page adds <strong>PNG, JPG, WebP</strong>, and other images, lets you{" "}
        <strong>reorder</strong> pages (drag or move controls), and builds one
        PDF with <strong>pdf-lib</strong> entirely in the browser—no upload step
        in the product copy. Options include <strong>page size</strong>{" "}
        (<em>auto</em> to match each image, or fixed <strong>A4</strong> /{" "}
        <strong>Letter</strong>), <strong>fit</strong> (<em>contain</em> keeps
        the whole image visible; <em>cover</em> fills the page and may crop),{" "}
        <strong>margins</strong> in points, and a raster fallback for formats
        the PDF engine cannot embed natively (for example some WebP paths).
      </p>

      <h2>Contain vs cover in plain language</h2>
      <ul>
        <li>
          <strong>Contain</strong>: the entire image stays visible; you may see
          empty margin if the aspect ratio does not match the page.
        </li>
        <li>
          <strong>Cover</strong>: the page is filled edge to edge; excess image
          beyond the page may be clipped—good for full-bleed hero shots, risky
          for screenshots with UI chrome at the edges.
        </li>
      </ul>

      <h2>File size and quality</h2>
      <p>
        Embedding a high-megapixel JPEG can produce a <strong>large PDF</strong>.
        If the destination is email only, consider resizing images in an editor
        first (for example long edge <strong>2000 px</strong> for on-screen
        review). For print, keep originals and pick fixed page sizes that match
        the vendor&apos;s spec.
      </p>

      <h2>Privacy</h2>
      <p>
        Insurance claims, HR onboarding, and legal exhibits should not pass
        through unvetted “free merge” sites. A <strong>local</strong> workflow
        or IT-approved software reduces retention risk; see{" "}
        <Link
          href="/blog/vendor-due-diligence-for-browser-tools"
          className={linkClass}
        >
          vendor due diligence for browser tools
        </Link>{" "}
        and{" "}
        <Link href="/blog/local-first-csv-privacy" className={linkClass}>
          local-first data handling
        </Link>
        .
      </p>

      <h2>Frequently asked questions</h2>

      <h3>Is JPG to PDF lossless?</h3>
      <p>
        The PDF wraps your JPEG; you do not have to re-compress if the tool
        embeds the bytes as-is. Some converters re-encode and soften detail—check
        output file size versus sources or use a known local tool.
      </p>

      <h3>Can I mix PNG and JPG in one PDF?</h3>
      <p>
        Yes. Tools like{" "}
        <Link href="/images-to-pdf" className={linkClass}>
          Images to PDF
        </Link>{" "}
        accept multiple image types in one queue; order them before export.
      </p>

      <h3>How do I fix upside-down pages?</h3>
      <p>
        Rotate in Photos or Preview before merging, or use a PDF editor after
        assembly; merge-only tools usually preserve the pixel data as loaded.
      </p>

      <h3>Free JPG to PDF conversion?</h3>
      <p>
        OS print-to-PDF, mobile share sheets, and Localtool&apos;s page are
        common zero-cost options; enterprise teams may still prefer managed
        Acrobat or Ghostscript pipelines for audit logs.
      </p>

      <h2>Next steps</h2>
      <p>
        Sort images, pick page size and fit, then export one PDF. Use{" "}
        <Link href="/images-to-pdf" className={linkClass}>
          Images to PDF
        </Link>{" "}
        for reorderable multi-file merges in the browser, or read{" "}
        <Link
          href="/blog/how-to-convert-pdf-to-jpg"
          className={linkClass}
        >
          how to convert PDF to JPG
        </Link>{" "}
        when you need raster pages instead. Browse{" "}
        <Link href="/blog" className={linkClass}>
          all Localtool articles
        </Link>
        .
      </p>
    </BlogProse>
  );
}
