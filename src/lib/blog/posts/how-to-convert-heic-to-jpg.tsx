import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "how-to-convert-heic-to-jpg",
  title: "How to convert HEIC to JPG: iPhone, Windows, Mac, and browser",
  description:
    "Turn HEIC/HEIF photos into JPG (JPEG) or PNG: change iPhone camera format, use Photos on Mac, add HEIF support on Windows, or convert locally in the browser—plus quality and batch tips.",
  publishedAt: "2026-04-01",
  category: "guide",
  readTimeMinutes: 10,
  keywords: [
    "how to convert heic to jpg",
    "heic to jpeg",
    "iphone heic converter",
    "heif to jpg",
    "convert heic windows",
  ],
};

export function BlogPostContent() {
  const linkClass =
    "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

  return (
    <BlogProse>
      <p>
        <strong>How to convert HEIC to JPG</strong> means exporting or
        re-encoding <strong>HEIC</strong> (often labeled{" "}
        <strong>HEIF</strong>) still images into{" "}
        <strong>JPEG</strong> (<code className="text-foreground">.jpg</code> /{" "}
        <code className="text-foreground">.jpeg</code>), which almost every
        app, CMS, and email client accepts. iPhones save stills as HEIC by
        default for smaller files; the friction appears when you email a photo,
        upload to a legacy form, or open the file on a PC without HEIF
        codecs. This guide covers <strong>device settings</strong>,{" "}
        <strong>desktop apps</strong>, and a <strong>local browser</strong> path
        that never uploads your images to a server.
      </p>

      <p>
        <strong>Key takeaways</strong>
      </p>
      <ul>
        <li>
          <strong>HEIC and HEIF</strong> describe the same family of
          efficiency-first formats; your phone may show one name and your
          computer another.
        </li>
        <li>
          <strong>JPG is lossy</strong>: each export can soften fine detail;
          keep originals when possible.
        </li>
        <li>
          On <strong>Windows</strong>, install Microsoft&apos;s{" "}
          <strong>HEIF Image Extensions</strong> to preview HEIC in File
          Explorer and Photos, then export—or skip installs with a browser
          converter.
        </li>
        <li>
          For <strong>many files at once</strong>, batch tools save hours
          compared to one-by-one export from Photos.
        </li>
      </ul>

      <h2>What HEIC is (and why JPG still matters)</h2>
      <p>
        Apple documents HEIF and HEVC-based photos under the compatibility topic{" "}
        <a
          href="https://support.apple.com/en-us/HT207022"
          className={linkClass}
          rel="noopener noreferrer"
          target="_blank"
        >
          Using HEIF or HEVC media on Apple devices
        </a>
        . HEIC typically delivers similar visual quality to JPEG at roughly{" "}
        <strong>half the file size</strong> for many scenes, which saves iCloud
        and device storage. The tradeoff is ecosystem support: JPEG has been
        universal since the 1990s, while HEIC needs modern OS builds, codecs, or
        conversion before some workflows.
      </p>

      <h2>Option 1: Shoot JPG on iPhone (new photos only)</h2>
      <p>
        If you control the capture step, switch future photos to JPEG. On
        iPhone, open <strong>Settings</strong> → <strong>Camera</strong> →{" "}
        <strong>Formats</strong> and choose <strong>Most Compatible</strong> so
        new stills save as JPEG (and video uses the broader-compatible H.264
        path Apple pairs with that setting). Existing HEIC files stay HEIC
        until you export or convert them. Details on HEIF/HEVC behavior and
        sharing appear in{" "}
        <a
          href="https://support.apple.com/en-us/HT207022"
          className={linkClass}
          rel="noopener noreferrer"
          target="_blank"
        >
          Apple&apos;s HEIF/HEVC support article
        </a>
        .
      </p>

      <h2>Option 2: Mac — Photos or Preview</h2>
      <p>
        In <strong>Photos</strong>, select images, then use{" "}
        <strong>File</strong> → <strong>Export</strong> →{" "}
        <strong>Export Photo</strong> and pick <strong>JPEG</strong> with a
        quality preset. For a handful of files, <strong>Preview</strong> can open
        HEIC and save as JPEG. This path keeps processing on your Mac and works
        well when you already curate albums in Photos.
      </p>

      <h2>Option 3: Windows — codecs, then export</h2>
      <p>
        Windows 10 and Windows 11 can display HEIC after you install{" "}
        <strong>HEIF Image Extensions</strong> from the Microsoft Store—check
        the listing for your account region and any IT policy that blocks Store
        apps. After the codec is present, the <strong>Photos</strong> app and
        File Explorer thumbnails usually work, and you can use{" "}
        <strong>Save as</strong> or <strong>Resize</strong> flows that output
        JPEG. If you cannot install Store codecs on a managed PC, use a
        portable or browser-based converter instead.
      </p>

      <h2>Option 4: Local browser conversion (bulk JPG or PNG)</h2>
      <p>
        Localtool&apos;s{" "}
        <Link href="/heic-to-jpg" className={linkClass}>
          HEIC to JPG/PNG
        </Link>{" "}
        page runs in your tab: add one or many <code className="text-foreground">
          .heic
        </code> / <code className="text-foreground">.heif</code> files, choose{" "}
        <strong>JPEG</strong> or <strong>PNG</strong> output, and download the
        results. Copy on the product UI states that conversion stays{" "}
        <strong>local</strong>—useful for client galleries, HR headshots, or
        listing photos you do not want on a random upload server. PNG avoids
        another JPEG generation cycle if you need a lossless raster for editing;
        JPG stays smaller for web and email.
      </p>

      <h2>JPG vs PNG after HEIC</h2>
      <ul>
        <li>
          <strong>JPEG</strong>: smallest files for photos; fine for social,
          blogs, and attachments under size limits.
        </li>
        <li>
          <strong>PNG</strong>: larger, lossless for 8-bit RGB; better when you
          will edit repeatedly or need transparency (uncommon for straight
          iPhone photos).
        </li>
      </ul>

      <h2>Privacy and batch workflow</h2>
      <p>
        Wedding photographers, real-estate marketers, and e-commerce teams
        often convert <strong>50–500</strong> HEICs after a shoot. Uploading
        that folder to an unknown site increases breach and licensing risk; a{" "}
        <strong>local or approved browser tool</strong> aligns with the same
        vendor checklist we use for CSV and analytics files—see{" "}
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

      <h3>Is HEIC the same as HEIF?</h3>
      <p>
        <strong>HEIF</strong> is the container/format family;{" "}
        <strong>HEIC</strong> is Apple&apos;s common filename for HEIF still
        images using HEVC compression. In practice people say “HEIC” for iPhone
        photos.
      </p>

      <h3>Will converting HEIC to JPG reduce quality?</h3>
      <p>
        JPEG is <strong>lossy</strong>. A high-quality export from Photos or a
        deliberate quality setting in a converter usually looks identical at
        normal viewing sizes. Avoid re-saving the same JPEG many times; archive
        the HEIC if you might re-edit later.
      </p>

      <h3>Why won’t my Windows PC open HEIC?</h3>
      <p>
        The OS needs a <strong>HEIF/HEVC decoder</strong>. Install Microsoft&apos;s
        HEIF Image Extensions (and HEVC Video Extensions if prompted for some
        files), or convert to JPG on another device or in the browser.
      </p>

      <h3>Can I convert HEIC to JPG for free?</h3>
      <p>
        Yes—Apple and Microsoft paths above are free aside from optional store
        charges for codecs in some regions; Localtool&apos;s converter is free
        and runs client-side in supported browsers.
      </p>

      <h3>Does Gmail or Outlook need JPG?</h3>
      <p>
        Many webmail clients preview HEIC inconsistently. Converting to JPEG
        before attaching avoids “recipient can’t open this” support tickets.
      </p>

      <h2>Next steps</h2>
      <p>
        Pick one path: change <strong>Camera → Formats</strong> for new shots,
        export from <strong>Photos</strong> on Mac, add <strong>HEIF</strong>{" "}
        support on Windows, or batch on{" "}
        <Link href="/heic-to-jpg" className={linkClass}>
          HEIC to JPG/PNG
        </Link>
        . Browse more workflows in the{" "}
        <Link href="/blog" className={linkClass}>
          Localtool blog
        </Link>
        .
      </p>
    </BlogProse>
  );
}
