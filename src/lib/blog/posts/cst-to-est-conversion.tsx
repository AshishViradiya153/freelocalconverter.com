import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "cst-to-est-conversion",
  title: "CST to EST: convert Central time to Eastern time (DST-safe)",
  description:
    "Convert Central time to Eastern time with correct DST rules. Learn the typical offset and use a browser converter based on IANA time zones.",
  publishedAt: "2026-03-31",
  category: "guide",
  readTimeMinutes: 6,
  keywords: ["cst to est", "central to eastern", "time zone converter", "cst est offset", "dst central eastern"],
};

const linkClass =
  "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        <strong>CST to EST</strong> is usually a <strong>+1 hour</strong> conversion
        (Eastern is ahead of Central). But the exact offset can change with{" "}
        <strong>daylight saving time (DST)</strong>, so it’s best to rely on real time
        zone rules for the date you’re converting.
      </p>

      <p>
        Use our{" "}
        <Link href="/cst-to-est" className={linkClass}>
          CST to EST converter
        </Link>{" "}
        (IANA time zones: <code className="text-foreground">America/Chicago</code> →{" "}
        <code className="text-foreground">America/New_York</code>).
      </p>

      <h2>Examples</h2>
      <ul>
        <li>
          <strong>10:00 AM Central</strong> → typically <strong>11:00 AM Eastern</strong>
        </li>
        <li>
          <strong>4:15 PM Central</strong> → typically <strong>5:15 PM Eastern</strong>
        </li>
      </ul>

      <h2>Related</h2>
      <p>
        Need Pacific to Eastern? Use{" "}
        <Link href="/pst-to-est" className={linkClass}>
          PST to EST
        </Link>
        .
      </p>
    </BlogProse>
  );
}

