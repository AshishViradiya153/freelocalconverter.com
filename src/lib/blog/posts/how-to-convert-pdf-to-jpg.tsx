import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "how-to-convert-pdf-to-jpg",
  title: "How to convert PDF to JPG: quality, DPI, and local export",
  description:
    "Export PDF pages as JPEG images: pick resolution and quality, handle white backgrounds for photos, and use desktop apps or Localtool’s browser PDF-to-image (ZIP, single pages, or combined).",
  publishedAt: "2026-04-02",
  category: "guide",
  readTimeMinutes: 10,
  keywords: [
    "how to convert pdf to jpg",
    "pdf to jpeg",
    "export pdf pages as images",
    "pdf to jpg online",
    "convert pdf to jpg locally",
  ],
};

export function BlogPostContent() {
  const linkClass =
    "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

  return (
    <BlogProse>
      <p>
        <strong>How to convert PDF to JPG</strong> usually means{" "}
        <strong>rasterizing</strong> each page—turning vector text and graphics
        into a pixel grid—then saving as{" "}
        <strong>JPEG</strong> (<code className="text-foreground">.jpg</code>). JPG
        is <strong>lossy</strong> and does not support transparency, so clear
        edges and flat colors can show compression artifacts unless you raise
        quality and resolution. This guide is for designers, marketers, and
        anyone who needs slides or contracts as web-friendly images, thumbnail
        strips, or attachments that refuse <code className="text-foreground">
          .pdf
        </code>
        .
      </p>

      <p>
        <strong>Key takeaways</strong>
      </p>
      <ul>
        <li>
          <strong>Higher DPI (or pixel width)</strong> yields sharper text;
          <strong> ~150 DPI</strong> is often enough for screens,{" "}
          <strong>300 DPI</strong> for print handoffs.
        </li>
        <li>
          JPEG flattens onto a <strong>background color</strong> (often white)
          where PDFs used transparency.
        </li>
        <li>
          Export <strong>only the pages you need</strong> to save time and disk
          space on long documents.
        </li>
        <li>
          For the reverse workflow, see{" "}
          <Link
            href="/blog/how-to-convert-jpg-to-pdf"
            className={linkClass}
          >
            how to convert JPG to PDF
          </Link>
          .
        </li>
      </ul>

      <h2>What “PDF to JPG” actually does</h2>
      <p>
        A PDF stores drawing instructions, fonts, and embedded images. A JPEG
        stores one flat picture per exported page (or one tall image if you
        stitch pages). Converters render the page to a bitmap, then encode with
        JPEG rules. That is why a 20-page PDF becomes{" "}
        <strong>20 separate JPG files</strong> unless you choose a combined
        export. Adobe documents the desktop export path in{" "}
        <a
          href="https://helpx.adobe.com/acrobat/using/pdf-to-jpg.html"
          className={linkClass}
          rel="noopener noreferrer"
          target="_blank"
        >
          Convert PDF to JPEG (Adobe Acrobat)
        </a>
        , including format and settings choices in the Convert / Export flow.
      </p>

      <h2>Method 1: Adobe Acrobat (desktop)</h2>
      <p>
        In Acrobat, use <strong>Convert</strong> or <strong>Export a PDF</strong>
        , choose an image format, set <strong>JPEG</strong>, adjust settings if
        offered, then save. This fits teams that already standardize on Creative
        Cloud or Acrobat Pro and need repeatable presets for client deliverables.
      </p>

      <h2>Method 2: Preview on Mac</h2>
      <p>
        Open the PDF in <strong>Preview</strong>, export a page or use{" "}
        <strong>Export as</strong> with JPEG; for multiple pages you may export
        repeatedly or duplicate selective pages first. It is quick for one-off
        screenshots of a page or two.
      </p>

      <h2>Method 3: Browser-based, local PDF to image</h2>
      <p>
        Localtool&apos;s{" "}
        <Link href="/pdf-to-image" className={linkClass}>
          PDF to Image
        </Link>{" "}
        tool runs with <strong>PDF.js</strong> in your tab: load a PDF, choose{" "}
        <strong>JPEG</strong> (or PNG/WebP), set <strong>DPI</strong> or target
        width, tune <strong>JPEG quality</strong>, pick pages (all, selected,
        ranges, odd/even), then download{" "}
        <strong>individual images</strong>, a <strong>ZIP</strong>, a{" "}
        <strong>long combined image</strong>, or a <strong>contact sheet</strong>
        . The in-app copy states conversion stays on your device—useful when
        contracts or unreleased creative should not hit a third-party upload API.
      </p>

      <h2>Choosing resolution and quality</h2>
      <ul>
        <li>
          <strong>Screen / email</strong>: width around{" "}
          <strong>1200–1600 px</strong> or ~150 DPI at page size often looks
          crisp on laptops and phones.
        </li>
        <li>
          <strong>Print</strong>: target <strong>300 DPI</strong> at the final
          printed dimensions to avoid fuzzy type.
        </li>
        <li>
          <strong>Quality slider</strong>: values near <strong>0.9</strong>{" "}
          (90%) usually balance size and artifacts; push higher for gradients and
          photos inside the PDF.
        </li>
      </ul>

      <h2>When PNG or WebP beats JPG</h2>
      <p>
        Use <strong>PNG</strong> for UI mockups, diagrams, and anything with hard
        edges or transparency. The same{" "}
        <Link href="/pdf-to-image" className={linkClass}>
          PDF to Image
        </Link>{" "}
        page offers PNG and WebP so you do not force JPEG on unsuitable content.
      </p>

      <h2>Privacy and batch exports</h2>
      <p>
        Batch page export is where upload-based “free converters” leak sensitive
        decks. Prefer desktop software or a reviewed local browser tool, and
        apply the same checklist as other data utilities:{" "}
        <Link
          href="/blog/vendor-due-diligence-for-browser-tools"
          className={linkClass}
        >
          vendor due diligence for browser tools
        </Link>
        ,{" "}
        <Link href="/blog/local-first-csv-privacy" className={linkClass}>
          local-first data handling
        </Link>
        .
      </p>

      <h2>Frequently asked questions</h2>

      <h3>Will one JPG contain all PDF pages?</h3>
      <p>
        Only if you explicitly use a <strong>stitched</strong> or contact-sheet
        style export. Default behavior for most tools is{" "}
        <strong>one image per page</strong>.
      </p>

      <h3>Why do my JPEGs have white bars instead of transparency?</h3>
      <p>
        JPEG cannot store an alpha channel. Converters composite transparent
        areas onto a background—often white—so expect flat fills unless you pick
        PNG.
      </p>

      <h3>Is converting PDF to JPG free?</h3>
      <p>
        Many browsers and preview apps do it without a subscription; Acrobat
        requires a license for its full export stack. Localtool&apos;s page is
        free and runs client-side in supported browsers.
      </p>

      <h3>Can I convert a password-protected PDF?</h3>
      <p>
        You must <strong>unlock</strong> the PDF first with the correct password
        and permission to export; tools cannot ethically bypass encryption.
      </p>

      <h2>Next steps</h2>
      <p>
        Open your PDF in the tool you trust, set JPEG with appropriate DPI and
        quality, and export only the pages you need. Try{" "}
        <Link href="/pdf-to-image" className={linkClass}>
          PDF to Image
        </Link>{" "}
        for local ZIP or combined outputs, or read{" "}
        <Link
          href="/blog/how-to-convert-jpg-to-pdf"
          className={linkClass}
        >
          how to convert JPG to PDF
        </Link>{" "}
        when you need the opposite direction. More guides:{" "}
        <Link href="/blog" className={linkClass}>
          Localtool blog
        </Link>
        .
      </p>
    </BlogProse>
  );
}
