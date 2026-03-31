import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "how-to-convert-feet-to-meters",
  title: "Feet to Meters: how to convert ft to m (exact factor + examples)",
  description:
    "Convert feet to meters using the exact factor 1 ft = 0.3048 m. Includes the formula, examples, and a quick in-browser Feet to Meters converter.",
  publishedAt: "2026-03-31",
  category: "guide",
  readTimeMinutes: 6,
  keywords: [
    "feet to meters",
    "ft to m",
    "convert feet to meters",
    "feet to meters formula",
    "height converter",
  ],
};

const linkClass =
  "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        To convert <strong>feet (ft)</strong> to <strong>meters (m)</strong>,
        multiply by the exact factor <code className="text-foreground">0.3048</code>:
      </p>
      <p>
        <code className="text-foreground">m = ft × 0.3048</code>
      </p>

      <p>
        For quick results, use{" "}
        <Link href="/feet-to-meters" className={linkClass}>
          Feet to Meters
        </Link>{" "}
        (local in your browser).
      </p>

      <h2>Examples: common feet to meters conversions</h2>
      <ul>
        <li>
          <strong>6 ft</strong> →{" "}
          <code className="text-foreground">6 × 0.3048 = 1.8288 m</code>
        </li>
        <li>
          <strong>5.5 ft</strong> →{" "}
          <code className="text-foreground">5.5 × 0.3048 = 1.6764 m</code>
        </li>
        <li>
          <strong>1 ft</strong> →{" "}
          <code className="text-foreground">0.3048 m</code>
        </li>
      </ul>

      <h2>Meters to feet (reverse)</h2>
      <p>
        The reverse conversion is:
      </p>
      <p>
        <code className="text-foreground">ft = m ÷ 0.3048</code>
      </p>

      <h2>Next: one tool for multiple unit conversions</h2>
      <p>
        If you also need weight conversions, use the{" "}
        <Link href="/unit-converter" className={linkClass}>
          Unit Converter
        </Link>
        .
      </p>
    </BlogProse>
  );
}

