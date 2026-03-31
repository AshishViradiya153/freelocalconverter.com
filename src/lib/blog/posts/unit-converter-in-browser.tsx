import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "unit-converter-in-browser",
  title: "Unit Converter (browser): lbs↔kg and feet→meters in one place",
  description:
    "A practical guide to quick unit conversions in the browser: lbs↔kg and feet→meters, with exact conversion factors and copy-friendly results.",
  publishedAt: "2026-03-31",
  category: "guide",
  readTimeMinutes: 7,
  keywords: [
    "unit converter",
    "convert units",
    "lbs to kg",
    "kg to lbs",
    "feet to meters",
  ],
};

const linkClass =
  "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        A good <strong>unit converter</strong> should do two things well: use{" "}
        <strong>correct constants</strong> and make it easy to <strong>copy</strong>{" "}
        the result into wherever you’re working (a spreadsheet, a ticket, an email).
      </p>
      <p>
        Our{" "}
        <Link href="/unit-converter" className={linkClass}>
          Unit Converter
        </Link>{" "}
        runs locally in your browser and currently supports:
      </p>
      <ul>
        <li>
          <strong>Lbs → Kg</strong> using{" "}
          <code className="text-foreground">1 lb = 0.45359237 kg</code>
        </li>
        <li>
          <strong>Kg → Lbs</strong> using the same exact factor (inverse)
        </li>
        <li>
          <strong>Feet → Meters</strong> using{" "}
          <code className="text-foreground">1 ft = 0.3048 m</code>
        </li>
      </ul>

      <h2>When a browser unit converter is handy</h2>
      <ul>
        <li>
          <strong>Product + ops</strong> converting package weights and dimensions.
        </li>
        <li>
          <strong>Fitness + health</strong> switching between imperial and metric.
        </li>
        <li>
          <strong>Engineering + construction</strong> sanity-checking lengths quickly.
        </li>
      </ul>

      <h2>Direct links to each conversion</h2>
      <p>
        If you prefer dedicated pages:
      </p>
      <ul>
        <li>
          <Link href="/lbs-to-kg" className={linkClass}>
            Lbs to Kg
          </Link>
        </li>
        <li>
          <Link href="/kg-to-lbs" className={linkClass}>
            Kg to Lbs
          </Link>
        </li>
        <li>
          <Link href="/feet-to-meters" className={linkClass}>
            Feet to Meters
          </Link>
        </li>
      </ul>

      <h2>Accuracy notes</h2>
      <p>
        The constants above are exact definitions. Rounding differences usually come
        from display formatting (how many decimals you choose), not from the conversion
        itself.
      </p>
    </BlogProse>
  );
}

