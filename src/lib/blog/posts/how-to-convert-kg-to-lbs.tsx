import { Link } from "@/i18n/navigation";
import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "how-to-convert-kg-to-lbs",
  title: "Kg to Lbs: how to convert kilograms to pounds (exact factor + examples)",
  description:
    "Convert kg to lbs using the exact factor 1 lb = 0.45359237 kg. Learn the formula, see examples, and use the in-browser Kg to Lbs converter.",
  publishedAt: "2026-03-31",
  category: "guide",
  readTimeMinutes: 6,
  keywords: [
    "kg to lbs",
    "kilograms to pounds",
    "kg to lb",
    "kg to lbs formula",
    "convert kg to pounds",
  ],
};

const linkClass =
  "font-medium text-foreground underline underline-offset-4 hover:text-foreground/90";

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        To convert <strong>kilograms (kg)</strong> to <strong>pounds (lb)</strong>,
        divide by the exact factor{" "}
        <code className="text-foreground">0.45359237</code>:
      </p>
      <p>
        <code className="text-foreground">lb = kg ÷ 0.45359237</code>
      </p>

      <p>
        Use our{" "}
        <Link href="/kg-to-lbs" className={linkClass}>
          Kg to Lbs converter
        </Link>{" "}
        for quick conversions (local in your browser).
      </p>

      <h2>Examples: common kg to lbs conversions</h2>
      <ul>
        <li>
          <strong>70 kg</strong> →{" "}
          <code className="text-foreground">70 ÷ 0.45359237 = 154.3235835 lb</code>{" "}
          (≈ <strong>154.32 lb</strong>)
        </li>
        <li>
          <strong>100 kg</strong> →{" "}
          <code className="text-foreground">100 ÷ 0.45359237 = 220.4622622 lb</code>{" "}
          (≈ <strong>220.46 lb</strong>)
        </li>
        <li>
          <strong>1 kg</strong> →{" "}
          <code className="text-foreground">2.204622622 lb</code> (approx.)
        </li>
      </ul>

      <h2>Reverse conversion (lbs to kg)</h2>
      <p>
        To convert pounds to kilograms:
      </p>
      <p>
        <code className="text-foreground">kg = lb × 0.45359237</code>
      </p>
      <p>
        Try:{" "}
        <Link href="/lbs-to-kg" className={linkClass}>
          Lbs to Kg
        </Link>
        .
      </p>

      <h2>Do it all on one page</h2>
      <p>
        For weight + length conversions together, open{" "}
        <Link href="/unit-converter" className={linkClass}>
          Unit Converter
        </Link>
        .
      </p>
    </BlogProse>
  );
}

