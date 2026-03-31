import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "pst-to-est-conversion",
  title: "PST to EST: how to convert times (and avoid DST mistakes)",
  description:
    "Convert Pacific time to Eastern time reliably. Learn the typical offset, why DST changes it, and use a browser tool that applies IANA time zones.",
  publishedAt: "2026-03-31",
  category: "guide",
  readTimeMinutes: 7,
  keywords: ["pst to est", "pacific to eastern", "time zone converter", "pst est offset", "dst pst est"],
};

const linkClass =
  "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        Converting <strong>PST to EST</strong> sounds simple, but the offset can change
        during <strong>daylight saving time (DST)</strong>. The safest approach is to use
        real time zone rules rather than hard-coding “+3 hours”.
      </p>

      <p>
        Use our{" "}
        <Link href="/pst-to-est" className={linkClass}>
          PST to EST converter
        </Link>{" "}
        which uses IANA time zones (<code className="text-foreground">America/Los_Angeles</code>{" "}
        → <code className="text-foreground">America/New_York</code>) in your browser.
      </p>

      <h2>What’s the PST to EST time difference?</h2>
      <p>
        In general, Eastern Time is <strong>3 hours ahead</strong> of Pacific Time.
        But during DST transitions, the effective offset depends on the date.
      </p>

      <h2>Examples</h2>
      <ul>
        <li>
          <strong>9:00 AM Pacific</strong> → typically <strong>12:00 PM Eastern</strong>
        </li>
        <li>
          <strong>2:30 PM Pacific</strong> → typically <strong>5:30 PM Eastern</strong>
        </li>
      </ul>

      <h2>Why DST causes mistakes</h2>
      <p>
        Some regions switch on different dates (or not at all). If you’re scheduling across
        teams, use a converter that applies rules for the specific date you care about.
      </p>

      <h2>Related</h2>
      <p>
        Also converting Central to Eastern? Use{" "}
        <Link href="/cst-to-est" className={linkClass}>
          CST to EST
        </Link>
        .
      </p>
    </BlogProse>
  );
}

